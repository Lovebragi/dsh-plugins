// flash.exe - taskbar attention for DeepSeek Harness (Windows).
//
// Modes
//   flash (default)  flash, then keep flashing every --interval ms until the DSH window is in the
//                    foreground (or --max-seconds elapses). This is the "tell me until I look" mode.
//   steady           leave a permanent amber bar on the taskbar button (ITaskbarList3 progress)
//   clear            remove that bar
//
// Integrity notes
//   DSH labels its workspace Low integrity; Windows starts any process from a Low-labeled image at
//   Low integrity, and a Low process cannot FlashWindowEx a normal window. The exe therefore lives
//   in %LOCALAPPDATA%\DshTaskbarFlash. When the caller is still too low (e.g. spawned by the DSH
//   host process), the exe delegates to the scheduled task "DshTaskbarFlash", which runs at normal
//   integrity and repeats the flash there.
//
// usage: flash.exe [--mode flash|steady|clear] [--count N] [--interval MS] [--max-seconds S]
//                  [--retry S] [--log FILE] [--title TEXT] [--now] [--quiet] [--stop]
//                  [--no-delegate]
// exit: 0 ok, 1 window not found, 2 Windows refused and delegation unavailable, 3 taskbar COM failed
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;

internal static class Flasher
{
    private const uint FLASHW_STOP = 0;
    private const uint FLASHW_TRAY = 2;
    private const uint FLASHW_TIMERNOFG = 12;

    private const int TBPF_NOPROGRESS = 0;
    private const int TBPF_PAUSED = 8;

    private const string DelegateTask = "DshTaskbarFlash";

    [StructLayout(LayoutKind.Sequential)]
    private struct FLASHWINFO
    {
        public uint cbSize;
        public IntPtr hwnd;
        public uint dwFlags;
        public uint uCount;
        public uint dwTimeout;
    }

    private delegate bool EnumProc(IntPtr hWnd, IntPtr lParam);

    [DllImport("user32.dll")] private static extern bool FlashWindowEx(ref FLASHWINFO pwfi);
    [DllImport("user32.dll")] private static extern bool IsWindowVisible(IntPtr hWnd);
    [DllImport("user32.dll")] private static extern bool IsWindow(IntPtr hWnd);
    [DllImport("user32.dll")] private static extern bool IsIconic(IntPtr hWnd);
    [DllImport("user32.dll")] private static extern IntPtr GetForegroundWindow();
    [DllImport("user32.dll")] private static extern bool EnumWindows(EnumProc callback, IntPtr lParam);
    [DllImport("user32.dll")] private static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint processId);
    [DllImport("user32.dll", CharSet = CharSet.Unicode)] private static extern int GetWindowTextLength(IntPtr hWnd);
    [DllImport("user32.dll", CharSet = CharSet.Unicode)] private static extern int GetWindowText(IntPtr hWnd, StringBuilder text, int count);
    [DllImport("user32.dll", CharSet = CharSet.Unicode)] private static extern int GetClassName(IntPtr hWnd, StringBuilder name, int count);

    [DllImport("kernel32.dll")] private static extern IntPtr GetCurrentProcess();
    [DllImport("kernel32.dll")] private static extern bool CloseHandle(IntPtr handle);
    [DllImport("advapi32.dll", SetLastError = true)] private static extern bool OpenProcessToken(IntPtr process, uint access, out IntPtr token);
    [DllImport("advapi32.dll", SetLastError = true)] private static extern bool GetTokenInformation(IntPtr token, int cls, IntPtr info, int len, out int ret);
    [DllImport("advapi32.dll")] private static extern IntPtr GetSidSubAuthority(IntPtr sid, uint index);
    [DllImport("advapi32.dll")] private static extern IntPtr GetSidSubAuthorityCount(IntPtr sid);

    [ComImport, Guid("56FDF344-FD6D-11d0-958A-006097C9A090")]
    private class TaskbarListClass { }

    [ComImport, Guid("ea1afb91-9e28-4b86-90e9-9e9f8a5eefaf"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    private interface ITaskbarList3
    {
        void HrInit();
        void AddTab(IntPtr hwnd);
        void DeleteTab(IntPtr hwnd);
        void ActivateTab(IntPtr hwnd);
        void SetActiveAlt(IntPtr hwnd);
        void MarkFullscreenWindow(IntPtr hwnd, [MarshalAs(UnmanagedType.Bool)] bool fFullscreen);
        void SetProgressValue(IntPtr hwnd, ulong ullCompleted, ulong ullTotal);
        void SetProgressState(IntPtr hwnd, int tbpFlags);
    }

    // ---- helpers -------------------------------------------------------------------------

    private static string Integrity()
    {
        try
        {
            IntPtr token;
            if (!OpenProcessToken(GetCurrentProcess(), 0x0008, out token)) return "?";
            try
            {
                int size;
                GetTokenInformation(token, 25, IntPtr.Zero, 0, out size);
                if (size <= 0) return "?";
                IntPtr buffer = Marshal.AllocHGlobal(size);
                try
                {
                    int ret;
                    if (!GetTokenInformation(token, 25, buffer, size, out ret)) return "?";
                    IntPtr sid = Marshal.ReadIntPtr(buffer);
                    int count = Marshal.ReadByte(GetSidSubAuthorityCount(sid));
                    int rid = Marshal.ReadInt32(GetSidSubAuthority(sid, (uint)(count - 1)));
                    switch (rid)
                    {
                        case 0x1000: return "Low";
                        case 0x2000: return "Medium";
                        case 0x3000: return "High";
                        case 0x4000: return "System";
                        default: return "0x" + rid.ToString("X");
                    }
                }
                finally { Marshal.FreeHGlobal(buffer); }
            }
            finally { CloseHandle(token); }
        }
        catch { return "?"; }
    }

    private static IntPtr[] FindWindows(string needle)
    {
        List<IntPtr> electron = new List<IntPtr>();
        List<IntPtr> other = new List<IntPtr>();
        EnumWindows(delegate(IntPtr h, IntPtr l)
        {
            if (!IsWindowVisible(h)) return true;
            int len = GetWindowTextLength(h);
            if (len <= 0) return true;
            StringBuilder sb = new StringBuilder(len + 2);
            GetWindowText(h, sb, sb.Capacity);
            if (sb.ToString().IndexOf(needle, StringComparison.OrdinalIgnoreCase) < 0) return true;
            StringBuilder cls = new StringBuilder(256);
            GetClassName(h, cls, 256);
            if (cls.ToString() == "Chrome_WidgetWin_1") electron.Add(h);
            else other.Add(h);
            return true;
        }, IntPtr.Zero);
        List<IntPtr> all = new List<IntPtr>(electron);
        all.AddRange(other);
        return all.ToArray();
    }

    private static bool SameProcessAsForeground(IntPtr target)
    {
        IntPtr fg = GetForegroundWindow();
        if (fg == IntPtr.Zero) return false;
        uint targetPid, fgPid;
        GetWindowThreadProcessId(target, out targetPid);
        GetWindowThreadProcessId(fg, out fgPid);
        return targetPid != 0 && targetPid == fgPid;
    }

    private static string Describe(IntPtr h)
    {
        uint pid;
        GetWindowThreadProcessId(h, out pid);
        return string.Format("hwnd=0x{0:X} pid={1} iconic={2}", (long)h, pid, IsIconic(h));
    }

    private static string Json(string action, string reason, int count, bool foreground, bool accepted, string target)
    {
        StringBuilder sb = new StringBuilder();
        sb.Append("{");
        sb.Append("\"time\":\"").Append(DateTime.Now.ToString("o")).Append("\",");
        sb.Append("\"ok\":").Append(action != "none" ? "true" : "false").Append(",");
        sb.Append("\"action\":\"").Append(action).Append("\",");
        sb.Append("\"reason\":\"").Append(reason).Append("\",");
        sb.Append("\"count\":").Append(count).Append(",");
        sb.Append("\"foreground\":").Append(foreground ? "true" : "false").Append(",");
        sb.Append("\"accepted\":").Append(accepted ? "true" : "false").Append(",");
        sb.Append("\"integrity\":\"").Append(Integrity()).Append("\",");
        sb.Append("\"target\":\"").Append(target).Append("\"");
        sb.Append("}");
        return sb.ToString();
    }

    private static void Emit(string line, string logFile, bool quiet)
    {
        if (!string.IsNullOrEmpty(logFile))
        {
            try { File.AppendAllText(logFile, line + Environment.NewLine, new UTF8Encoding(true)); }
            catch { }
        }
        if (!quiet) Console.WriteLine(line);
    }

    private static void FlashWindow(IntPtr hwnd, uint flags, uint count)
    {
        FLASHWINFO info = new FLASHWINFO();
        info.cbSize = (uint)Marshal.SizeOf(typeof(FLASHWINFO));
        info.hwnd = hwnd;
        info.dwFlags = flags;
        info.uCount = count;
        info.dwTimeout = 0;
        FlashWindowEx(ref info);
    }

    private static void Delegate()
    {
        try
        {
            ProcessStartInfo psi = new ProcessStartInfo("schtasks.exe");
            psi.Arguments = "/run /tn " + DelegateTask;
            psi.UseShellExecute = false;
            psi.CreateNoWindow = true;
            psi.WindowStyle = ProcessWindowStyle.Hidden;
            using (Process p = Process.Start(psi)) p.WaitForExit(5000);
        }
        catch { }
    }

    // ---- modes ---------------------------------------------------------------------------

    private static int Main(string[] args)
    {
        int count = 5;
        int intervalMs = 1200;
        int maxSeconds = 0;
        int retry = 45;
        bool now = false, stop = false, quiet = false, noDelegate = false;
        string mode = "flash";
        string logFile = null;
        string title = "DeepSeek Harness";

        for (int i = 0; i < args.Length; i++)
        {
            switch (args[i])
            {
                case "--count": if (i + 1 < args.Length) count = int.Parse(args[++i]); break;
                case "--interval": if (i + 1 < args.Length) intervalMs = int.Parse(args[++i]); break;
                case "--max-seconds": if (i + 1 < args.Length) maxSeconds = int.Parse(args[++i]); break;
                case "--retry": if (i + 1 < args.Length) retry = int.Parse(args[++i]); break;
                case "--log": if (i + 1 < args.Length) logFile = args[++i]; break;
                case "--title": if (i + 1 < args.Length) title = args[++i]; break;
                case "--mode": if (i + 1 < args.Length) mode = args[++i]; break;
                case "--now": now = true; break;
                case "--stop": stop = true; break;
                case "--quiet": quiet = true; break;
                case "--no-delegate": noDelegate = true; break;
            }
        }

        if (mode == "steady" || mode == "clear")
        {
            return Steady(mode == "steady", title, logFile, quiet);
        }

        DateTime firstDeadline = DateTime.UtcNow.AddSeconds(Math.Max(retry, 0));
        DateTime hardDeadline = maxSeconds > 0 ? DateTime.UtcNow.AddSeconds(maxSeconds) : DateTime.MaxValue;

        while (true)
        {
            IntPtr[] handles = FindWindows(title);
            if (handles.Length == 0)
            {
                Emit(Json("none", "dsh-window-not-found", count, false, false, ""), logFile, quiet);
                return 1;
            }

            IntPtr target = handles[0];
            bool foreground = SameProcessAsForeground(target);

            if (!now && foreground)
            {
                if (DateTime.UtcNow < firstDeadline)
                {
                    Thread.Sleep(750);
                    continue;
                }
                Emit(Json("skipped", "window-still-focused", count, true, false, Describe(target)), logFile, quiet);
                return 0;
            }

            uint flags = stop ? FLASHW_STOP : (FLASHW_TRAY | FLASHW_TIMERNOFG);
            bool accepted = true;
            foreach (IntPtr h in handles)
            {
                FLASHWINFO info = new FLASHWINFO();
                info.cbSize = (uint)Marshal.SizeOf(typeof(FLASHWINFO));
                info.hwnd = h;
                info.dwFlags = flags;
                info.uCount = (uint)count;
                info.dwTimeout = 0;
                if (!FlashWindowEx(ref info)) accepted = false;
            }

            if (!accepted && !stop && !noDelegate)
            {
                Delegate();
                Emit(Json("delegated", "low-integrity", count, foreground, false, Describe(target)), logFile, quiet);
                return 0;
            }

            Emit(Json(stop ? "stopped" : "flashing", "", count, foreground, accepted, Describe(target)), logFile, quiet);
            if (stop || !accepted) return accepted ? 0 : 2;

            // Keep the reminder alive until the user activates DSH.
            while (true)
            {
                if (DateTime.UtcNow > hardDeadline) return 0;
                Thread.Sleep(Math.Max(intervalMs, 200));

                IntPtr[] again = FindWindows(title);
                if (again.Length == 0) return 0;
                if (SameProcessAsForeground(again[0]))
                {
                    FlashWindow(again[0], FLASHW_STOP, 0);
                    Emit(Json("acknowledged", "window-focused", count, true, true, Describe(again[0])), logFile, quiet);
                    return 0;
                }
                FlashWindow(again[0], FLASHW_TRAY | FLASHW_TIMERNOFG, (uint)count);
            }
        }
    }

    private static int Steady(bool on, string title, string logFile, bool quiet)
    {
        IntPtr[] handles = FindWindows(title);
        if (handles.Length == 0)
        {
            Emit(Json("none", "dsh-window-not-found", 0, false, false, ""), logFile, quiet);
            return 1;
        }
        try
        {
            ITaskbarList3 bar = (ITaskbarList3)new TaskbarListClass();
            bar.HrInit();
            foreach (IntPtr h in handles)
            {
                if (on)
                {
                    bar.SetProgressState(h, TBPF_PAUSED);
                    bar.SetProgressValue(h, 100, 100);
                }
                else
                {
                    bar.SetProgressState(h, TBPF_NOPROGRESS);
                }
            }
            Emit(Json(on ? "steady-on" : "steady-off", "", 0, false, true, Describe(handles[0])), logFile, quiet);
            return 0;
        }
        catch (Exception error)
        {
            Emit(Json("none", "taskbar-list-failed:" + error.GetType().Name, 0, false, false, Describe(handles[0])), logFile, quiet);
            return 3;
        }
    }
}
