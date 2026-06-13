import React, { useState, useEffect, useMemo } from 'react';
import {
  CheckCircle2,
  Target,
  Compass,
  Trash2,
  Award,
  PenTool,
  Database,
  Activity,
  Flame,
  BookOpen,
  TrendingUp,
  Plus,
  Search,
  Sparkles,
  Clock,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  AlertTriangle,
  Star,
  CheckCircle,
  HelpCircle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from 'recharts';

// --- Type Definitions ---
interface TaskItem {
  id: string;
  title: string;
  category: string;
  status: 'pending' | 'in_progress' | 'done';
  date?: string;
  custom?: boolean;
}

interface SubjectItem {
  id: string;
  name: string;
  confidence: number;
  pyq: number;
  notes: string;
  custom?: boolean;
}

interface MockScore {
  date: string;
  score: number;
  maxScore?: number;
}

interface NoteItem {
  text: string;
  date: string;
}

interface BinItem {
  id: string;
  source: string;
  index: number;
  item: any;
  label: string;
  deletedAt: number;
  expiresAt: number;
}

interface AppSettings {
  rollover: boolean;
  lastOpen: string;
}

interface AppState {
  today: TaskItem[];
  backlog: TaskItem[];
  roadmap: Record<string, TaskItem[]>;
  notes: NoteItem[];
  subjects: SubjectItem[];
  scores: MockScore[];
  restore: BinItem[];
  settings: AppSettings;
}

// --- Initial Constants ---
const LOCAL_STORAGE_KEY = 'sanjay_hybrid_v1';

const WORKOUT_ROUTINES = [
  ['Rest Day', '🌴 Full rest, recover well, stretch'],
  ['Push Day', '🦍 Wall push-ups, knee push-ups, pike push-ups, tricep dips, plank + wall stand'],
  ['Pull+Core', '🐍 Door frame rows, superman, leg raises, side plank, hollow body + wall stand'],
  ['Active Rest', '🧘 Cat-cow, chest opener, chin tucks, wall stand'],
  ['Push Day', '🦍 Wall push-ups, knee push-ups, pike push-ups, tricep dips, plank + wall stand'],
  ['Pull+Core', '🐍 Door frame rows, superman, leg raises, side plank, hollow body + wall stand'],
  ['Rest Day', '🌴 Full rest, recover well, stretch']
];

const WEEKWAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const DEFAULT_CCBP = [
  'Responsive Web Design - Week 1',
  'Responsive Web Design - Week 2',
  'Responsive Web Design - Week 3',
  'Responsive Web Design - Week 4',
  'Responsive Web Design - Week 5',
  'Responsive Web Design - Week 6',
  'Responsive Web Design - Week 7',
  'Responsive Web Design - Week 8',
  'JavaScript Basics',
  'Advanced JavaScript',
  'React JS fundamentals',
  'Node.js & Express',
  'Databases - SQL'
];

const DEFAULT_LINUX = [
  'Shell basics & navigation',
  'File operations & permissions',
  'Text processing (grep, awk, sed)',
  'Process management',
  'Networking commands (nmap, netstat)',
  'Package management (apt, dpkg)',
  'Bash scripting - variables & loops',
  'Bash scripting - conditionals & functions',
  'VirtualBox & Kali setup',
  'IITB FOSS - pending modules'
];

const DEFAULT_ROADMAP: Record<string, string[]> = {
  y1: [
    'Clear CCBP 7-week backlog',
    'Complete IITB Linux course',
    'Master core Linux commands (ls, cd, grep, awk, chmod...)',
    'Learn OSI model - all 7 layers',
    'Learn TCP/IP, DNS, HTTP, SSH fundamentals',
    'Install & practice Wireshark',
    'Maintain 9+ CGPA',
    'Complete IPL ML project (CCBP)',
    'Set up GitHub profile & push portfolio projects'
  ],
  y2: [
    'Start TryHackMe Pre-Security path',
    'Complete THM: How the Web Works',
    'Complete THM: Linux Fundamentals 1-3',
    'Complete THM: Network Fundamentals',
    'Buy ESP32 + DHT11 sensor (~Rs 350-580)',
    'ESP32 Project 1: Sensor -> serial monitor',
    'ESP32 Project 2: Sensor -> MQTT over WiFi',
    'ESP32 Project 3: Live dashboard (React/HTML)',
    'Learn Modbus TCP basics',
    'Run ModRSsim2 + pymodbus Python script'
  ],
  y3: [
    'Simulate MITM attack on MQTT (Wireshark/mitmproxy)',
    'Replay attack simulation on ESP32 commands',
    'Secure MQTT with TLS/SSL',
    'Add JWT auth to backend API',
    'Document all attacks + fixes on GitHub',
    'Study CompTIA Security+ (Prof Messer - free)',
    'Study ISA/IEC 62443 awareness',
    '5 portfolio projects live on GitHub'
  ],
  y4: [
    'Apply to Siemens India internship',
    'Apply to Schneider Electric internship',
    'Apply to ABB / Honeywell',
    'Prepare IoT/OT security interview pitch',
    'Target: Rs 10-18 LPA at Tier 1 (Siemens/ABB)'
  ]
};

const GATE_SUBJECTS = [
  'Engineering Mathematics',
  'Network Theory / Electric Circuits',
  'Signals and Systems',
  'Control Systems',
  'Electronic Devices and Circuits',
  'Analog and Digital Electronics',
  'Measurements and Industrial Instrumentation',
  'Communication Systems'
];

// --- Utilities ---
const generateId = () => {
  try {
    return window.crypto.randomUUID();
  } catch {
    return Math.random().toString(36).substring(2, 11);
  }
};

const getLocalDayString = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
};

const createItem = (title: string, category: string, custom = false): TaskItem => ({
  id: generateId(),
  title,
  category,
  status: 'pending',
  custom
});

const getPrerenderedState = (): AppState => {
  return {
    today: [],
    backlog: [
      ...DEFAULT_CCBP.map(x => createItem(x, 'ccbp')),
      ...DEFAULT_LINUX.map(x => createItem(x, 'linux'))
    ],
    roadmap: Object.fromEntries(
      Object.entries(DEFAULT_ROADMAP).map(([yr, arr]) => [yr, arr.map(x => createItem(x, yr))])
    ),
    notes: [],
    subjects: GATE_SUBJECTS.map((x, i) => ({
      id: `g${i}`,
      name: x,
      confidence: 1,
      pyq: 0,
      notes: ''
    })),
    scores: [
      { date: '2026-05-15', score: 38 },
      { date: '2026-05-22', score: 45 },
      { date: '2026-05-29', score: 42 },
      { date: '2026-06-05', score: 58 },
      { date: '2026-06-12', score: 64 },
    ],
    restore: [],
    settings: {
      rollover: false,
      lastOpen: getLocalDayString()
    }
  };
};

export default function App() {
  const [state, setState] = useState<AppState>(() => {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (raw) {
        const loaded = JSON.parse(raw);
        // Deep validate fields
        loaded.today = loaded.today || [];
        loaded.backlog = loaded.backlog || [];
        loaded.roadmap = loaded.roadmap || {};
        ['y1', 'y2', 'y3', 'y4'].forEach(y => {
          loaded.roadmap[y] = loaded.roadmap[y] || [];
        });
        loaded.notes = loaded.notes || [];
        loaded.subjects = loaded.subjects || [];
        loaded.scores = loaded.scores || [];
        loaded.restore = loaded.restore || [];
        loaded.settings = loaded.settings || { rollover: false, lastOpen: getLocalDayString() };
        return loaded;
      }
    } catch (e) {
      console.warn('Could not parse localStorage state, generating fresh', e);
    }
    return getPrerenderedState();
  });

  // Active tab selection
  const [activeTab, setActiveTab] = useState<'today' | 'backlog' | 'roadmap' | 'notes' | 'gate' | 'restore' | 'data'>('today');

  // Input states
  const [todayInput, setTodayInput] = useState('');
  const [todayCategory, setTodayCategory] = useState('ccbp');
  const [backlogSearch, setBacklogSearch] = useState('');
  const [backlogFilter, setBacklogFilter] = useState<'all' | 'ccbp' | 'linux' | 'custom'>('all');
  const [customBacklogTitle, setCustomBacklogTitle] = useState('');
  const [customBacklogCategory, setCustomBacklogCategory] = useState('project');
  const [newCcbpTitle, setNewCcbpTitle] = useState('');
  const [newLnxTitle, setNewLnxTitle] = useState('');
  const [roadmapInputs, setRoadmapInputs] = useState<Record<string, string>>({ y1: '', y2: '', y3: '', y4: '' });
  const [scratchMemo, setScratchMemo] = useState('');
  const [newGateSub, setNewGateSub] = useState('');
  const [mockRegDate, setMockRegDate] = useState(() => getLocalDayString());
  const [mockRegScore, setMockRegScore] = useState('');
  const [mockRegMaxScore, setMockRegMaxScore] = useState('100');
  const [confirmEmptyBin, setConfirmEmptyBin] = useState(false);
  const [confirmWipeAll, setConfirmWipeAll] = useState(false);

  // Local Clock State
  const [clockStr, setClockStr] = useState('');

  // Floating notifications HUD
  const [toast, setToast] = useState<{ active: boolean; message: string; icon: string }>({
    active: false,
    message: '',
    icon: '✨'
  });

  const triggerToast = (message: string, icon = '✨') => {
    setToast({ active: true, message, icon });
    setTimeout(() => {
      setToast(prev => ({ ...prev, active: false }));
    }, 3200);
  };

  // Persist State Helper
  const updateState = (updater: (prev: AppState) => AppState) => {
    setState(prev => {
      // Deep clone previous state to prevent direct mutation side-effects during React StrictMode double rendering
      const cloned = JSON.parse(JSON.stringify(prev)) as AppState;
      const updated = updater(cloned);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  // Reset confirmations on tab change
  useEffect(() => {
    setConfirmEmptyBin(false);
    setConfirmWipeAll(false);
  }, [activeTab]);

  // Clock ticks
  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setClockStr(d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }));
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  // Handle Rollover and Expiry routines once on load
  useEffect(() => {
    const todayStr = getLocalDayString();
    updateState(prev => {
      const copy = { ...prev };
      
      // Expire old restored items
      const now = Date.now();
      copy.restore = (copy.restore || []).filter(x => x.expiresAt > now);

      // Handle rollover if toggled
      const last = copy.settings.lastOpen;
      if (last && last !== todayStr && copy.settings.rollover) {
        copy.today.filter(x => x.date === last && x.status !== 'done').forEach(x => {
          const alreadyExists = copy.today.some(t => t.date === todayStr && t.title === x.title);
          if (!alreadyExists) {
            copy.today.push({
              ...x,
              id: generateId(),
              date: todayStr,
              status: 'pending'
            });
          }
        });
      }
      copy.settings.lastOpen = todayStr;
      
      return copy;
    });
  }, []);

  // Format nice human friendly date
  const niceDateStr = useMemo(() => {
    return new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
  }, []);

  // Counts & Progresses for charts
  const statsSummary = useMemo(() => {
    const todayCurrent = state.today.filter(x => x.date === getLocalDayString());
    
    const countDone = (arr: TaskItem[]) => arr.filter(x => x.status === 'done').length;

    const cc = state.backlog.filter(x => x.category === 'ccbp');
    const li = state.backlog.filter(x => x.category === 'linux');
    const rd = Object.values(state.roadmap).flat() as TaskItem[];

    const ccDone = countDone(cc);
    const liDone = countDone(li);
    const rdDone = countDone(rd);
    const todayDone = countDone(todayCurrent);

    const ccPct = cc.length ? Math.round((ccDone / cc.length) * 100) : 0;
    const liPct = li.length ? Math.round((liDone / li.length) * 100) : 0;
    const rdPct = rd.length ? Math.round((rdDone / rd.length) * 100) : 0;
    const todayPct = todayCurrent.length ? Math.round((todayDone / todayCurrent.length) * 100) : 0;

    return {
      cc: { done: ccDone, total: cc.length, pct: ccPct },
      li: { done: liDone, total: li.length, pct: liPct },
      rd: { done: rdDone, total: rd.length, pct: rdPct },
      today: { done: todayDone, total: todayCurrent.length, pct: todayPct }
    };
  }, [state]);

  // Workout details by day
  const workoutBadgeAndDesc = useMemo(() => {
    const currentDayIndex = new Date().getDay();
    const info = WORKOUT_ROUTINES[currentDayIndex];
    return { name: info[0], detail: info[1], dayIdx: currentDayIndex };
  }, []);

  // Focus Warning Triggers
  const backlogFocusWarning = useMemo(() => {
    return state.backlog.filter(x => x.status === 'in_progress').length > 1;
  }, [state.backlog]);

  const roadmapFocusWarning = useMemo(() => {
    return (Object.values(state.roadmap).flat() as TaskItem[]).filter(x => x.status === 'in_progress').length > 1;
  }, [state.roadmap]);

  // Handle generic task status change
  const handleTaskStatusChange = (id: string, group: 'today' | 'backlog' | string, newStatus: 'pending' | 'in_progress' | 'done') => {
    updateState(prev => {
      const copy = { ...prev };
      let updatedTask: TaskItem | undefined;

      if (group === 'today') {
        const found = copy.today.find(x => x.id === id);
        if (found) { found.status = newStatus; updatedTask = found; }
      } else if (group === 'backlog') {
        const found = copy.backlog.find(x => x.id === id);
        if (found) { found.status = newStatus; updatedTask = found; }
      } else if (group.startsWith('road.')) {
        const yr = group.split('.')[1];
        const found = copy.roadmap[yr]?.find(x => x.id === id);
        if (found) { found.status = newStatus; updatedTask = found; }
      }

      if (updatedTask && newStatus === 'done') {
        triggerToast(`Conquered: "${updatedTask.title}"!`, '🎉');
      } else {
        triggerToast(`calibrated: ${newStatus.replace('_', ' ')}`, '⚡');
      }

      return copy;
    });
  };

  // Delete operation sending item to bin
  const handleItemDelete = (id: string, group: 'today' | 'backlog' | string) => {
    updateState(prev => {
      const copy = { ...prev };
      let deleted: any = null;
      let label = '';
      let index = -1;

      if (group === 'today') {
        index = copy.today.findIndex(x => x.id === id);
        if (index > -1) {
          deleted = copy.today.splice(index, 1)[0];
          label = deleted.title;
        }
      } else if (group === 'backlog') {
        index = copy.backlog.findIndex(x => x.id === id);
        if (index > -1) {
          deleted = copy.backlog.splice(index, 1)[0];
          label = deleted.title;
        }
      } else if (group.startsWith('road.')) {
        const yr = group.split('.')[1];
        index = copy.roadmap[yr]?.findIndex(x => x.id === id);
        if (index > -1) {
          deleted = copy.roadmap[yr].splice(index, 1)[0];
          label = deleted.title;
        }
      } else if (group === 'subjects') {
        index = copy.subjects.findIndex(x => x.id === id);
        if (index > -1) {
          deleted = copy.subjects.splice(index, 1)[0];
          label = deleted.name;
        }
      }

      if (deleted) {
        copy.restore.push({
          id: generateId(),
          source: group,
          index,
          item: deleted,
          label: label || 'Task entry',
          deletedAt: Date.now(),
          expiresAt: Date.now() + 86450000 // 24 hours expiry
        });
        triggerToast('Archived in bin', '♻️');
      }

      return copy;
    });
  };

  // Add Task Handlers
  const handleAddTodayTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!todayInput.trim()) return;

    updateState(prev => {
      const copy = { ...prev };
      copy.today.push({
        id: generateId(),
        title: todayInput.trim(),
        category: todayCategory,
        status: 'pending',
        date: getLocalDayString(),
        custom: true
      });
      return copy;
    });
    setTodayInput('');
    triggerToast('Added today\'s task coordinate!', '🎯');
  };

  const handleAddBacklogItem = (cat: 'ccbp' | 'linux') => {
    const titleVal = cat === 'ccbp' ? newCcbpTitle : newLnxTitle;
    if (!titleVal.trim()) return;

    updateState(prev => {
      const copy = { ...prev };
      copy.backlog.push({
        id: generateId(),
        title: titleVal.trim(),
        category: cat,
        status: 'pending',
        custom: true
      });
      return copy;
    });

    if (cat === 'ccbp') setNewCcbpTitle('');
    else setNewLnxTitle('');
    triggerToast(`Mapped into ${cat.toUpperCase()}`, '������');
  };

  const handleAddCustomBacklogTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customBacklogTitle.trim()) return;

    updateState(prev => {
      const copy = { ...prev };
      copy.backlog.push({
        id: generateId(),
        title: customBacklogTitle.trim(),
        category: 'custom',
        status: 'pending',
        custom: true
      });
      return copy;
    });

    setCustomBacklogTitle('');
    triggerToast('Custom backlog mapped!', '⚙️');
  };

  const handleAddRoadmapMilestone = (yr: string) => {
    const nodeVal = roadmapInputs[yr];
    if (!nodeVal?.trim()) return;

    updateState(prev => {
      const copy = { ...prev };
      copy.roadmap[yr].push({
        id: generateId(),
        title: nodeVal.trim(),
        category: yr,
        status: 'pending',
        custom: true
      });
      return copy;
    });

    setRoadmapInputs(prev => ({ ...prev, [yr]: '' }));
    triggerToast(`Year ${yr.toUpperCase().replace('Y', ' ')} roadmap updated`, '🗺️');
  };

  const handleSaveScratchpad = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scratchMemo.trim()) return;

    updateState(prev => {
      const copy = { ...prev };
      copy.notes.unshift({
        text: scratchMemo.trim(),
        date: new Date().toLocaleString()
      });
      return copy;
    });

    setScratchMemo('');
    triggerToast('Thoughts safely stored locally', '📝');
  };

  const handlePurgeNote = (index: number) => {
    updateState(prev => {
      const copy = { ...prev };
      const deleted = copy.notes.splice(index, 1)[0];
      copy.restore.push({
        id: generateId(),
        source: 'notes',
        index,
        item: deleted,
        label: deleted.text.slice(0, 50),
        deletedAt: Date.now(),
        expiresAt: Date.now() + 86450000
      });
      return copy;
    });
    triggerToast('Scratchpad memo shelved in bin', '🗑️');
  };

  // GATE Operations
  const handleUpdateConfidence = (id: string, stars: number) => {
    updateState(prev => {
      const copy = { ...prev };
      const found = copy.subjects.find(x => x.id === id);
      if (found) {
        found.confidence = stars;
        triggerToast(`${found.name} confidence tuned`, '⭐️');
      }
      return copy;
    });
  };

  const handleUpdatePyqRate = (id: string, pct: number) => {
    updateState(prev => {
      const copy = { ...prev };
      const found = copy.subjects.find(x => x.id === id);
      if (found) {
        found.pyq = Math.max(0, Math.min(100, pct));
      }
      return copy;
    });
  };

  const handleUpdateSubjectNotes = (id: string, text: string) => {
    updateState(prev => {
      const copy = { ...prev };
      const found = copy.subjects.find(x => x.id === id);
      if (found) {
        found.notes = text;
      }
      return copy;
    });
  };

  const handleAddCustomSubject = (e: React.FormEvent) => {
    e.preventDefault();
    const subjectName = newGateSub.trim();
    if (!subjectName) return;

    let alreadyExists = false;

    updateState(prev => {
      const copy = { ...prev };
      const isDuplicate = copy.subjects.some(
        x => x.name.toLowerCase() === subjectName.toLowerCase()
      );
      if (isDuplicate) {
        alreadyExists = true;
        return copy;
      }
      copy.subjects.push({
        id: generateId(),
        name: subjectName,
        confidence: 1,
        pyq: 0,
        notes: '',
        custom: true
      });
      return copy;
    });

    setNewGateSub('');
    if (alreadyExists) {
      triggerToast('Syllabus unit already exists!', '⚠️');
    } else {
      triggerToast('Subject syllabus track added!', '🎓');
    }
  };

  const handleRegisterMockScore = (e: React.FormEvent) => {
    e.preventDefault();
    const sc = Number(mockRegScore);
    const mx = Number(mockRegMaxScore) || 100;
    if (!mockRegDate || !Number.isFinite(sc) || !Number.isFinite(mx) || sc < 0 || mx <= 0) {
      triggerToast('Please write scores and maximum points as positive numbers!', '⚠️');
      return;
    }
    if (sc > mx) {
      triggerToast(`Registered score cannot exceed the maximum of ${mx}!`, '⚠️');
      return;
    }

    updateState(prev => {
      const copy = { ...prev };
      // Keep lists sorted by date
      copy.scores.push({ date: mockRegDate, score: sc, maxScore: mx });
      copy.scores.sort((a,b) => a.date.localeCompare(b.date));
      return copy;
    });

    setMockRegScore('');
    triggerToast('Mock score registered!', '📊');
  };

  const handleDeleteMockScore = (index: number) => {
    updateState(prev => {
      const copy = { ...prev };
      copy.scores = [...copy.scores];
      copy.scores.splice(index, 1);
      return copy;
    });
    triggerToast('Mock score deleted!', '🗑️');
  };

  // Bin recovering operations
  const handleRecoverBinItem = (binId: string) => {
    updateState(prev => {
      const copy = { ...prev };
      const x = copy.restore.find(z => z.id === binId);
      if (!x) return copy;

      if (x.source === 'today') {
        copy.today.splice(Math.min(x.index, copy.today.length), 0, x.item);
      } else if (x.source === 'backlog') {
        copy.backlog.splice(Math.min(x.index, copy.backlog.length), 0, x.item);
      } else if (x.source.startsWith('road.')) {
        const yr = x.source.split('.')[1];
        copy.roadmap[yr].splice(Math.min(x.index, copy.roadmap[yr].length), 0, x.item);
      } else if (x.source === 'subjects') {
        copy.subjects.splice(Math.min(x.index, copy.subjects.length), 0, x.item);
      } else if (x.source === 'notes') {
        copy.notes.splice(Math.min(x.index, copy.notes.length), 0, x.item);
      }

      copy.restore = copy.restore.filter(z => z.id !== binId);
      triggerToast(`Recovered source: ${x.source.replace('road.', 'Y')}`, '♻️');
      return copy;
    });
  };

  const handlePurgeBinPermanent = (binId: string) => {
    updateState(prev => {
      const copy = { ...prev };
      copy.restore = copy.restore.filter(x => x.id !== binId);
      return copy;
    });
    triggerToast('Wiped permanently!', '🔥');
  };

  const handlePurgeAllBin = () => {
    if (state.restore.length === 0) return;
    if (!confirmEmptyBin) {
      setConfirmEmptyBin(true);
      triggerToast('Click button again to confirm permanent purge!', '⚠️');
      return;
    }

    updateState(prev => {
      const copy = { ...prev };
      copy.restore = [];
      return copy;
    });
    setConfirmEmptyBin(false);
    triggerToast('Recycle bin completely cleared', '🔥');
  };

  const handleRetrieveAllBin = () => {
    if (state.restore.length === 0) return;
    updateState(prev => {
      const copy = { ...prev };
      const itemsToRecover = [...copy.restore];
      
      itemsToRecover.forEach(x => {
        if (x.source === 'today') {
          copy.today.splice(Math.min(x.index, copy.today.length), 0, x.item);
        } else if (x.source === 'backlog') {
          copy.backlog.splice(Math.min(x.index, copy.backlog.length), 0, x.item);
        } else if (x.source.startsWith('road.')) {
          const yr = x.source.split('.')[1];
          copy.roadmap[yr].splice(Math.min(x.index, copy.roadmap[yr].length), 0, x.item);
        } else if (x.source === 'subjects') {
          copy.subjects.splice(Math.min(x.index, copy.subjects.length), 0, x.item);
        } else if (x.source === 'notes') {
          copy.notes.splice(Math.min(x.index, copy.notes.length), 0, x.item);
        }
      });
      
      copy.restore = [];
      return copy;
    });
    setConfirmEmptyBin(false);
    triggerToast('All outstanding items restored!', '♻️');
  };

  // Backup file export/import
  const handleExportBackup = () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' }));
    a.download = `sanjay-planner-backup-${getLocalDayString()}.json`;
    a.click();
    triggerToast('Backup JSON downloaded', '💾');
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string);
        if (parsed && Array.isArray(parsed.today) && Array.isArray(parsed.backlog) && parsed.roadmap) {
          updateState(() => parsed);
          triggerToast('Database restored flawlessly!', '📂');
        } else {
          throw new Error();
        }
      } catch {
        triggerToast('Uploaded JSON template is invalid', '⚠️');
      }
    };
    reader.readAsText(f);
  };

  const handleEraseEverything = () => {
    if (!confirmWipeAll) {
      setConfirmWipeAll(true);
      triggerToast('Click button again to confirm complete database erase!', '⚠️');
      return;
    }

    updateState(() => getPrerenderedState());
    setConfirmWipeAll(false);
    triggerToast('Local database cleared', '⚠️');
  };

  // --- Filtering computations ---
  const processedScores = useMemo(() => {
    return state.scores.map(x => {
      const max = x.maxScore || 100;
      const pct = Math.round((x.score / max) * 100);
      return {
        ...x,
        percent: pct,
        maxScore: max
      };
    });
  }, [state.scores]);

  const filteredTodayTasks = useMemo(() => {
    return state.today.filter(x => x.date === getLocalDayString());
  }, [state.today]);

  const historicalTaskDays = useMemo(() => {
    const hist = state.today.filter(x => x.date !== getLocalDayString());
    const grouped: Record<string, TaskItem[]> = {};
    hist.forEach(x => {
      if (x.date) {
        grouped[x.date] = grouped[x.date] || [];
        grouped[x.date].push(x);
      }
    });
    return Object.entries(grouped).sort((a,b) => b[0].localeCompare(a[0]));
  }, [state.today]);

  const filteredBacklogItems = useMemo(() => {
    const query = backlogSearch.toLowerCase().trim();
    const filter = backlogFilter;

    const items = state.backlog.filter(x => {
      const matchQuery = x.title.toLowerCase().includes(query);
      const matchFilter = filter === 'all' || x.category === filter;
      return matchQuery && matchFilter;
    });

    return {
      ccbp: items.filter(x => x.category === 'ccbp'),
      linux: items.filter(x => x.category === 'linux'),
      custom: items.filter(x => x.category === 'custom')
    };
  }, [state.backlog, backlogSearch, backlogFilter]);

  // Calculations for remaining expiration times
  const getExpiresTimer = (expiresAt: number) => {
    const m = Math.max(0, Math.ceil((expiresAt - Date.now()) / 60000));
    return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`;
  };

  // Recharts Pie Chart Data
  const pieData = useMemo(() => {
    const todayCurrent = filteredTodayTasks;
    const completed = todayCurrent.filter(x => x.status === 'done').length;
    const pending = todayCurrent.length - completed;
    
    if (todayCurrent.length === 0) {
      return [{ name: 'No tasks', value: 1, color: '#e2e8f0' }];
    }

    return [
      { name: 'Completed', value: completed, color: '#10b981' },
      { name: 'Pending', value: pending, color: '#a5b4fc' }
    ];
  }, [filteredTodayTasks]);

  // Recharts Progress Bar Data
  const progressComparisonData = useMemo(() => {
    return [
      { name: 'CCBP 4.0', Covered: Math.round(statsSummary.cc.pct), color: '#818cf8', subtext: `${statsSummary.cc.done}/${statsSummary.cc.total}` },
      { name: 'FOSS Linux', Covered: Math.round(statsSummary.li.pct), color: '#0ea5e9', subtext: `${statsSummary.li.done}/${statsSummary.li.total}` },
      { name: 'Roadmap', Covered: Math.round(statsSummary.rd.pct), color: '#f59e0b', subtext: `${statsSummary.rd.done}/${statsSummary.rd.total}` }
    ];
  }, [statsSummary]);

  return (
    <div className="min-h-screen pb-20 selection:bg-brand-purple/20 selection:text-brand-purple">
      <main className="max-w-[850px] mx-auto px-4 pt-8 md:pt-12">
        
        {/* --- DYNAMIC HEADER HUD --- */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white border border-neutral-200/80 rounded-2xl p-5 mb-6 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.015)] space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-brand-purple via-violet-500 to-brand-cyan flex items-center justify-center text-white shadow-lg shadow-indigo-600/10">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-neutral-900 font-display">
                Sanjay's <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-purple to-brand-cyan">Studio</span>
              </h1>
              <p className="font-mono text-xs text-neutral-400 font-semibold uppercase tracking-wider mt-0.5">
                Industrial OT & Cybersecurity Core
              </p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-col items-start sm:items-end w-full sm:w-auto border-t sm:border-t-0 border-neutral-100 pt-3 sm:pt-0 space-y-1 sm:space-y-0.5">
            <span className="font-display text-xs sm:text-sm font-bold text-neutral-800 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-brand-purple animate-ping shrink-0" />
              {niceDateStr}
            </span>
            <span className="font-mono text-[11px] sm:text-xs text-neutral-400 font-medium flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
              {clockStr || '00:00:00'} LOCAL
            </span>
          </div>
        </header>

        {/* --- PREMIUM COMPACT PILL TABS --- */}
        <nav className="sticky top-4 z-50 flex items-center gap-1 p-1 bg-white/90 backdrop-blur-xl border border-neutral-200/80 rounded-2xl mb-8 overflow-x-auto scrollbar-none shadow-md shadow-neutral-100/50">
          <button
            onClick={() => setActiveTab('today')}
            className={`tab flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
              activeTab === 'today'
                ? 'bg-neutral-900 text-white shadow-sm'
                : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50'
            }`}
          >
            <Activity className="w-4 h-4 shrink-0" />
            Today's Lab
          </button>
          <button
            onClick={() => setActiveTab('backlog')}
            className={`tab flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
              activeTab === 'backlog'
                ? 'bg-neutral-900 text-white shadow-sm'
                : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50'
            }`}
          >
            <Target className="w-4 h-4 shrink-0" />
            Backlog Focus
          </button>
          <button
            onClick={() => setActiveTab('roadmap')}
            className={`tab flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
              activeTab === 'roadmap'
                ? 'bg-neutral-900 text-white shadow-sm'
                : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50'
            }`}
          >
            <Compass className="w-4 h-4 shrink-0" />
            Vectors
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`tab flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
              activeTab === 'notes'
                ? 'bg-neutral-900 text-white shadow-sm'
                : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50'
            }`}
          >
            <PenTool className="w-4 h-4 shrink-0" />
            Scratchpad
          </button>
          <button
            onClick={() => setActiveTab('gate')}
            className={`tab flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
              activeTab === 'gate'
                ? 'bg-neutral-900 text-white shadow-sm'
                : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50'
            }`}
          >
            <Award className="w-4 h-4 shrink-0" />
            GATE EE/IN
          </button>
          <button
            onClick={() => setActiveTab('restore')}
            className={`tab flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
              activeTab === 'restore'
                ? 'bg-red-50 text-red-700 border border-red-200 shadow-sm'
                : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50'
            }`}
          >
            <Trash2 className="w-4 h-4 shrink-0" />
            Bin {state.restore.length > 0 && `(${state.restore.length})`}
          </button>
          <button
            onClick={() => setActiveTab('data')}
            className={`tab flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
              activeTab === 'data'
                ? 'bg-neutral-950 text-white shadow-sm'
                : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50'
            }`}
          >
            <Database className="w-4 h-4 shrink-0" />
            System
          </button>
        </nav>


        {/* ==================== PANEL: TODAY'S LAB ==================== */}
        {activeTab === 'today' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
            
            {/* Visual HUD Bento Cards & Charts Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Daily Habit completeness, dynamic doughnut */}
              <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-sm">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-display font-medium text-xs tracking-wider text-neutral-400 uppercase">
                    Daily Goal Completeness
                  </h3>
                  <span className="font-mono text-xs font-bold text-neutral-600">
                    {statsSummary.today.done}/{statsSummary.today.total} done
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="w-[130px] h-[130px] relative flex justify-center items-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          innerRadius={45}
                          outerRadius={60}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute text-center">
                      <span className="block text-2xl font-extrabold text-neutral-800 font-display">
                        {statsSummary.today.pct}%
                      </span>
                      <span className="text-[10px] text-neutral-400 tracking-wider font-semibold uppercase">
                        Yield Rate
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2.5 flex-1 pl-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-brand-emerald shrink-0" />
                        <span className="text-xs text-neutral-600 font-medium">Completed</span>
                      </div>
                      <span className="text-xs font-semibold text-neutral-800">
                        {filteredTodayTasks.filter(x => x.status === 'done').length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-indigo-300 shrink-0" />
                        <span className="text-xs text-neutral-600 font-medium">Pending</span>
                      </div>
                      <span className="text-xs font-semibold text-neutral-800">
                        {filteredTodayTasks.filter(x => x.status !== 'done').length}
                      </span>
                    </div>
                    <div className="h-px bg-neutral-100 my-2" />
                    <div className="text-[11px] text-neutral-400 italic">
                      {statsSummary.today.pct === 100 
                        ? '🚀 perfect day trajectory initialized!' 
                        : 'Calibrate focus to unlock 100%'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress Summary comparison modules chart */}
              <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-sm">
                <h3 className="font-display font-medium text-xs tracking-wider text-neutral-400 uppercase mb-4">
                  Syllabus & Milestones Vector Yield
                </h3>
                
                <div className="h-32 mb-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={progressComparisonData} margin={{ top: 5, right: 10, left: -25, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#737373', fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#737373' }} axisLine={false} tickLine={false} />
                      <RechartsTooltip 
                        contentStyle={{ borderRadius: '8px', border: '1px solid #e5e5e5', fontSize: '11px' }}
                        formatter={(val) => [`${val}%`, 'Yield']}
                      />
                      <Bar dataKey="Covered" radius={[4, 4, 0, 0]}>
                        {progressComparisonData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center mt-1">
                  {progressComparisonData.map((item, idx) => (
                    <div key={idx} className="bg-neutral-50 border border-neutral-100 rounded-lg p-1.5">
                      <span className="block font-mono text-xs font-bold text-neutral-800">{item.subtext}</span>
                      <span className="text-[9px] text-neutral-400 tracking-wider font-semibold uppercase">{item.name}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Workout Desk */}
            <article className="bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
                <div>
                  <h2 className="font-display font-extrabold text-base text-neutral-950 flex items-center gap-2">
                    🏋️ Workout Routines Hub
                  </h2>
                  <p className="text-xs text-neutral-400 mt-0.5">Physical foundations powering technical execution</p>
                </div>
                <span className="py-1 px-3 text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-xl">
                  {workoutBadgeAndDesc.name}
                </span>
              </div>

              {/* 7-day compact schedule */}
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5 sm:gap-2 my-4">
                {WEEKWAYS_SHORT.map((day, idx) => {
                  const isToday = idx === workoutBadgeAndDesc.dayIdx;
                  const routineTitle = WORKOUT_ROUTINES[idx][0].split(' ')[0];
                  return (
                    <div
                      key={day}
                      className={`text-center p-2 rounded-xl border transition-all duration-150 ${
                        isToday
                          ? 'bg-neutral-900 border-neutral-950 text-white shadow-md'
                          : 'bg-neutral-50/50 border-neutral-100 text-neutral-400 hover:bg-neutral-50 hover:border-neutral-200'
                      }`}
                    >
                      <span className="block text-[10px] uppercase tracking-wider font-bold">{day}</span>
                      <span className={`block font-mono text-[9px] font-bold mt-1 ${isToday ? 'text-indigo-400' : 'text-neutral-500'}`}>
                        {routineTitle}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="bg-neutral-50 rounded-xl p-3 border border-neutral-100 flex items-start gap-2">
                <span className="text-lg">🎯</span>
                <p className="text-neutral-600 text-xs leading-relaxed font-medium">
                  {workoutBadgeAndDesc.detail}
                </p>
              </div>
            </article>

            {/* Daily tasks */}
            <article className="bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="font-display font-extrabold text-base text-neutral-950">
                    🎯 Targets Configured For Today
                  </h2>
                  <p className="text-xs text-neutral-400 mt-0.5">Daily atomic tasks to crush</p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={state.settings.rollover}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      updateState(prev => {
                        const copy = { ...prev };
                        copy.settings.rollover = checked;
                        return copy;
                      });
                      triggerToast(`Rolling over: ${checked ? 'Activated' : 'Disabled'}`, '🔄');
                    }}
                    className="rounded text-brand-purple focus:ring-brand-purple w-4 h-4"
                  />
                  <span className="text-xs font-bold text-neutral-600">Roll over pending</span>
                </label>
              </div>

              {/* Injected rows list */}
              <div className="space-y-2 mb-6">
                {filteredTodayTasks.map(item => (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-150 ${
                      item.status === 'done'
                        ? 'bg-neutral-50/70 border-neutral-100 text-neutral-400 line-through'
                        : 'bg-white border-neutral-200 hover:border-neutral-300'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <button
                        onClick={() => handleTaskStatusChange(item.id, 'today', item.status === 'done' ? 'pending' : 'done')}
                        className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                          item.status === 'done'
                            ? 'bg-brand-emerald border-brand-emerald text-white'
                            : 'border-neutral-350 hover:border-brand-purple'
                        }`}
                      >
                        {item.status === 'done' && <CheckCircle className="w-4 h-4" />}
                      </button>
                      <div className="min-w-0">
                        <span className="text-xs font-semibold text-neutral-800 break-words max-w-full">
                          {item.title}
                        </span>
                        <span className="inline-block font-mono text-[9px] uppercase tracking-wider bg-neutral-100 text-neutral-500 font-bold px-1.5 py-0.5 ml-2.5 rounded">
                          {item.category}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <select
                        value={item.status}
                        onChange={(e) => handleTaskStatusChange(item.id, 'today', e.target.value as any)}
                        className={`text-xs font-bold px-2 py-1 rounded-lg border bg-neutral-55 cursor-pointer outline-none ${
                          item.status === 'done'
                            ? 'border-emerald-100 text-brand-emerald bg-emerald-50'
                            : item.status === 'in_progress'
                            ? 'border-amber-100 text-brand-amber bg-amber-50 animate-pulse'
                            : 'border-neutral-200 text-neutral-500'
                        }`}
                      >
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="done">Completed</option>
                      </select>

                      <button
                        onClick={() => handleItemDelete(item.id, 'today')}
                        className="p-1 text-neutral-300 hover:text-red-500 hover:bg-red-50 rounded"
                        title="Archive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

                {filteredTodayTasks.length === 0 && (
                  <p className="text-neutral-400 text-xs text-center py-8 bg-neutral-50/50 border border-dashed border-neutral-200 rounded-xl leading-relaxed">
                    ☀️ Current queue is pristine. <br />Add today's task coordinates below to register goals!
                  </p>
                )}
              </div>

              {/* Add daily task form */}
              <form onSubmit={handleAddTodayTask} className="bg-neutral-50/80 border border-dashed border-neutral-200 p-4 rounded-xl">
                <span className="block font-display font-bold text-[10px] text-neutral-400 uppercase tracking-widest mb-3">
                  Quick Add Task Coordinate
                </span>
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <input
                    type="text"
                    value={todayInput}
                    onChange={(e) => setTodayInput(e.target.value)}
                    placeholder="e.g., Run pymodbus Python command line drills..."
                    className="flex-1 bg-white border border-neutral-200 rounded-xl px-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-purple"
                  />
                  <div className="flex gap-2">
                    <select
                      value={todayCategory}
                      onChange={(e) => setTodayCategory(e.target.value)}
                      className="bg-white border border-neutral-200 rounded-xl px-3 py-2 text-xs font-bold text-neutral-600 focus:outline-none focus:ring-2 focus:ring-brand-purple"
                    >
                      <option value="ccbp">CCBP 4.0</option>
                      <option value="linux">Linux FOSS</option>
                      <option value="college">College</option>
                      <option value="workout">Workout</option>
                      <option value="other">Other</option>
                    </select>

                    <button
                      type="submit"
                      className="bg-neutral-900 text-white font-semibold text-xs px-5 py-2.5 rounded-xl hover:bg-neutral-800 flex items-center gap-1.5 shadow-sm active:scale-95 transition"
                    >
                      <Plus className="w-4 h-4 shrink-0" /> Add
                    </button>
                  </div>
                </div>
              </form>
            </article>

            {/* Historical logs */}
            <details className="group border border-neutral-200 rounded-2xl bg-white overflow-hidden shadow-sm transition-all duration-150">
              <summary className="flex justify-between items-center p-4 cursor-pointer font-display font-extrabold text-sm text-neutral-800 list-none outline-none select-none hover:bg-neutral-50/60">
                <span>📂 Historical Day-by-Day Workspace Log</span>
                <ChevronDown className="w-4 h-4 text-neutral-400 group-open:rotate-180 transition-transform duration-200" />
              </summary>
              <div className="p-4 border-t border-neutral-100 bg-neutral-50/30 max-h-[400px] overflow-y-auto space-y-4">
                {historicalTaskDays.map(([dateKey, tasks]) => (
                  <div key={dateKey} className="bg-white p-4 border border-neutral-200 rounded-xl">
                    <span className="font-mono text-xs font-bold text-indigo-600 block mb-2">{dateKey}</span>
                    <div className="space-y-1.5">
                      {tasks.map(t => (
                        <div key={t.id} className="flex justify-between items-center py-1 text-xs text-neutral-700">
                          <span className={t.status === 'done' ? 'line-through text-neutral-400' : ''}>{t.title}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            t.status === 'done' ? 'bg-emerald-50 text-brand-emerald' : 'bg-neutral-150 text-neutral-500'
                          }`}>
                            {t.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                {historicalTaskDays.length === 0 && (
                  <p className="text-xs text-neutral-400 text-center py-4">No completed history exists yet in the database.</p>
                )}
              </div>
            </details>

          </div>
        )}


        {/* ==================== PANEL: BACKLOG FOCUS ==================== */}
        {activeTab === 'backlog' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
            
            {/* Focus warnings */}
            {backlogFocusWarning && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 text-amber-800 leading-relaxed z-10 transition">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-xs font-semibold">Multiple Items Marked "In Progress"</strong>
                  <p className="text-xs text-amber-700 mt-0.5">
                    Executing multiple goals simultaneously creates background leakage. Freeze secondary nodes to perfect a single coordinate first!
                  </p>
                </div>
              </div>
            )}

            {/* Live Search backlog inputs */}
            <div className="bg-white border border-neutral-200/80 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 shrink-0" />
                <input
                  type="text"
                  value={backlogSearch}
                  onChange={(e) => setBacklogSearch(e.target.value)}
                  placeholder="🔍 Search modules, topics, or tasks instantly..."
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl pl-10 pr-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-purple transition-all"
                />
              </div>

              <div className="flex gap-1 overflow-x-auto scrollbar-none shrink-0 py-0.5">
                <button
                  onClick={() => setBacklogFilter('all')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                    backlogFilter === 'all'
                      ? 'bg-neutral-900 text-white'
                      : 'bg-neutral-50 text-neutral-500 hover:text-neutral-900 border border-neutral-200/30'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setBacklogFilter('ccbp')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                    backlogFilter === 'ccbp'
                      ? 'bg-indigo-50 border border-indigo-100 text-indigo-700'
                      : 'bg-neutral-50 text-neutral-500 hover:text-neutral-900 border border-neutral-200/30'
                  }`}
                >
                  CCBP
                </button>
                <button
                  onClick={() => setBacklogFilter('linux')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                    backlogFilter === 'linux'
                      ? 'bg-cyan-50 border border-cyan-100 text-cyan-700'
                      : 'bg-neutral-50 text-neutral-500 hover:text-neutral-900 border border-neutral-200/30'
                  }`}
                >
                  Linux
                </button>
                <button
                  onClick={() => setBacklogFilter('custom')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                    backlogFilter === 'custom'
                      ? 'bg-amber-50 border border-amber-100 text-amber-700'
                      : 'bg-neutral-50 text-neutral-500 hover:text-neutral-900 border border-neutral-200/30'
                  }`}
                >
                  Custom
                </button>
              </div>
            </div>

            {/* Grid display layout */}
            <div className="grid grid-cols-1 gap-6">
              
              {/* CCBP Modules */}
              {(backlogFilter === 'all' || backlogFilter === 'ccbp') && (
                <article className="bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-sm">
                  <div className="flex justify-between items-center mb-2">
                    <h2 className="font-display font-extrabold text-sm text-neutral-900">
                      📚 CCBP 4.0 Academy Tracks
                    </h2>
                    <span className="font-mono text-xs font-bold bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-lg">
                      {statsSummary.cc.done}/{statsSummary.cc.total} Done
                    </span>
                  </div>
                  {/* Progress Glow Strip */}
                  <div className="w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden mb-5">
                    <div className="h-full bg-gradient-to-r from-brand-purple to-violet-500 rounded-full transition-all duration-300" style={{ width: `${statsSummary.cc.pct}%` }} />
                  </div>

                  {/* List container */}
                  <div className="space-y-2 mb-4 max-h-[300px] overflow-y-auto pr-1">
                    {filteredBacklogItems.ccbp.map(task => (
                      <div key={task.id} className="flex justify-between items-center p-2.5 border border-neutral-50 bg-neutral-50/20 rounded-xl hover:bg-neutral-50/50 transition">
                        <span className={`text-xs font-semibold ${task.status === 'done' ? 'line-through text-neutral-400' : 'text-neutral-700'}`}>{task.title}</span>
                        <div className="flex items-center gap-2">
                          <select
                            value={task.status}
                            onChange={(e) => handleTaskStatusChange(task.id, 'backlog', e.target.value as any)}
                            className={`text-[10px] font-bold py-1 px-1.5 border rounded-lg ${
                              task.status === 'done' ? 'text-brand-emerald bg-emerald-50 border-emerald-100' : task.status === 'in_progress' ? 'text-brand-amber bg-amber-50 border-amber-100' : 'text-neutral-500 bg-white border-neutral-200'
                            }`}
                          >
                            <option value="pending">Pending</option>
                            <option value="in_progress">In Progress</option>
                            <option value="done">Done</option>
                          </select>
                          {task.custom && (
                            <button onClick={() => handleItemDelete(task.id, 'backlog')} className="text-neutral-300 hover:text-red-500 p-0.5 transform transition"><Trash2 className="w-3.5 h-3.5" /></button>
                          )}
                        </div>
                      </div>
                    ))}
                    {filteredBacklogItems.ccbp.length === 0 && <p className="text-xs text-neutral-400 text-center py-4">No tracks mapped matching criteria.</p>}
                  </div>

                  {/* Add action inline */}
                  <div className="border-t border-neutral-100 pt-3 flex gap-2">
                    <input
                      type="text"
                      value={newCcbpTitle}
                      onChange={(e) => setNewCcbpTitle(e.target.value)}
                      placeholder="Add CCBP track node (e.g. Redux Sagas)"
                      className="flex-1 bg-neutral-50/50 border border-neutral-200 px-3 py-1.5 rounded-xl text-xs focus:outline-none"
                    />
                    <button onClick={() => handleAddBacklogItem('ccbp')} className="bg-indigo-600 text-white font-bold text-xs px-4 py-2 rounded-xl hover:bg-indigo-700 active:scale-95 transition">
                      Map CCBP
                    </button>
                  </div>
                </article>
              )}

              {/* FOSS LINUX */}
              {(backlogFilter === 'all' || backlogFilter === 'linux') && (
                <article className="bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-sm">
                  <div className="flex justify-between items-center mb-2">
                    <h2 className="font-display font-extrabold text-sm text-neutral-900">
                      🐧 IITB FOSS Linux Engineering
                    </h2>
                    <span className="font-mono text-xs font-bold bg-cyan-50 text-cyan-750 px-2.5 py-0.5 rounded-lg text-cyan-700">
                      {statsSummary.li.done}/{statsSummary.li.total} Done
                    </span>
                  </div>
                  {/* Progress Glow Strip */}
                  <div className="w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden mb-5">
                    <div className="h-full bg-gradient-to-r from-brand-cyan to-indigo-400 rounded-full transition-all duration-300" style={{ width: `${statsSummary.li.pct}%` }} />
                  </div>

                  {/* List container */}
                  <div className="space-y-2 mb-4 max-h-[300px] overflow-y-auto pr-1">
                    {filteredBacklogItems.linux.map(task => (
                      <div key={task.id} className="flex justify-between items-center p-2.5 border border-neutral-50 bg-neutral-50/20 rounded-xl hover:bg-neutral-50/50 transition">
                        <span className={`text-xs font-semibold ${task.status === 'done' ? 'line-through text-neutral-400' : 'text-neutral-700'}`}>{task.title}</span>
                        <div className="flex items-center gap-2">
                          <select
                            value={task.status}
                            onChange={(e) => handleTaskStatusChange(task.id, 'backlog', e.target.value as any)}
                            className={`text-[10px] font-bold py-1 px-1.5 border rounded-lg ${
                              task.status === 'done' ? 'text-brand-emerald bg-emerald-50 border-emerald-100' : task.status === 'in_progress' ? 'text-brand-amber bg-amber-50 border-amber-100' : 'text-neutral-500 bg-white border-neutral-200'
                            }`}
                          >
                            <option value="pending">Pending</option>
                            <option value="in_progress">In Progress</option>
                            <option value="done">Done</option>
                          </select>
                          {task.custom && (
                            <button onClick={() => handleItemDelete(task.id, 'backlog')} className="text-neutral-300 hover:text-red-500 p-0.5 transform transition"><Trash2 className="w-3.5 h-3.5" /></button>
                          )}
                        </div>
                      </div>
                    ))}
                    {filteredBacklogItems.linux.length === 0 && <p className="text-xs text-neutral-400 text-center py-4">No linux modules matching criteria.</p>}
                  </div>

                  {/* Add action inline */}
                  <div className="border-t border-neutral-100 pt-3 flex gap-2">
                    <input
                      type="text"
                      value={newLnxTitle}
                      onChange={(e) => setNewLnxTitle(e.target.value)}
                      placeholder="Add Linux core node (e.g. systemd networking config)"
                      className="flex-1 bg-neutral-50/50 border border-neutral-200 px-3 py-1.5 rounded-xl text-xs focus:outline-none"
                    />
                    <button onClick={() => handleAddBacklogItem('linux')} className="bg-cyan-600 text-white font-bold text-xs px-4 py-2 rounded-xl hover:bg-cyan-700 active:scale-95 transition">
                      Map Linux
                    </button>
                  </div>
                </article>
              )}

              {/* CUSTOM TASK BACKLOG */}
              {(backlogFilter === 'all' || backlogFilter === 'custom') && (
                <article className="bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-sm">
                  <div className="flex justify-between items-center mb-2">
                    <h2 className="font-display font-extrabold text-sm text-neutral-900">
                      🛠️ Custom Backlog Targets
                    </h2>
                    <span className="font-mono text-xs font-bold bg-amber-55 text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-lg">
                      {statsSummary.today.done + statsSummary.rd.done} tracks
                    </span>
                  </div>
                  
                  {/* List container */}
                  <div className="space-y-2 mb-4 max-h-[300px] overflow-y-auto pr-1">
                    {filteredBacklogItems.custom.map(task => (
                      <div key={task.id} className="flex justify-between items-center p-2.5 border border-neutral-50 bg-neutral-50/20 rounded-xl hover:bg-neutral-50/50 transition">
                        <div>
                          <span className={`text-xs font-semibold ${task.status === 'done' ? 'line-through text-neutral-400' : 'text-neutral-700'}`}>{task.title}</span>
                          <span className="inline-block font-mono text-[8px] bg-neutral-100 ml-2.5 px-1 py-0.3 uppercase rounded">custom</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <select
                            value={task.status}
                            onChange={(e) => handleTaskStatusChange(task.id, 'backlog', e.target.value as any)}
                            className={`text-[10px] font-bold py-1 px-1.5 border rounded-lg ${
                              task.status === 'done' ? 'text-brand-emerald bg-emerald-50 border-emerald-100' : task.status === 'in_progress' ? 'text-brand-amber bg-amber-50 border-amber-100' : 'text-neutral-500 bg-white border-neutral-200'
                            }`}
                          >
                            <option value="pending">Pending</option>
                            <option value="in_progress">In Progress</option>
                            <option value="done">Done</option>
                          </select>
                          <button onClick={() => handleItemDelete(task.id, 'backlog')} className="text-neutral-300 hover:text-red-500 p-0.5 transform transition"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                    ))}
                    {filteredBacklogItems.custom.length === 0 && <p className="text-xs text-neutral-400 text-center py-8">No custom backlog nodes registered yet.</p>}
                  </div>

                  {/* Add action box */}
                  <form onSubmit={handleAddCustomBacklogTask} className="border-t border-neutral-100 pt-4">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={customBacklogTitle}
                        onChange={(e) => setCustomBacklogTitle(e.target.value)}
                        placeholder="Register custom backlog (e.g. Set up WireGuard tunnel)"
                        className="flex-1 bg-neutral-50/50 border border-neutral-200 px-3 py-1.5 rounded-xl text-xs focus:outline-none"
                      />
                      <div className="flex gap-2">
                        <select
                          value={customBacklogCategory}
                          onChange={(e) => setCustomBacklogCategory(e.target.value)}
                          className="bg-white border border-neutral-200 rounded-xl px-2.5 py-1 text-xs focus:outline-none"
                        >
                          <option value="project">Project</option>
                          <option value="college">College</option>
                          <option value="other">Other</option>
                        </select>
                        <button type="submit" className="bg-amber-600 text-white font-bold text-xs px-4 py-2 rounded-xl hover:bg-amber-700 active:scale-95 transition whitespace-nowrap">
                          Lock Custom
                        </button>
                      </div>
                    </div>
                  </form>
                </article>
              )}

            </div>

          </div>
        )}


        {/* ==================== PANEL: ROADMAP ==================== */}
        {activeTab === 'roadmap' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
            
            {/* North star banner card */}
            <div className="bg-slate-900 border border-slate-950 text-white rounded-2xl p-6 relative overflow-hidden shadow-md">
              <div className="absolute right-0 bottom-0 translate-y-6 translate-x-6 opacity-5 pointer-events-none">
                <Compass className="w-64 h-64 text-white" />
              </div>
              <div className="relative z-10">
                <span className="font-mono text-[9px] text-brand-cyan tracking-[0.2em] font-extrabold uppercase">
                  🎯 NORTH STAR AMBITION
                </span>
                <h2 className="font-display font-black text-lg md:text-xl text-neutral-50 mt-1 mb-2.5">
                  OT/SCADA & Industrial Cybersecurity
                </h2>
                <p className="text-slate-400 text-xs leading-relaxed max-w-[550px]">
                  Fusing complex electronic systems configurations (EIE) with cybersecurity architectures, industrial communications networks, and SCADA shields. Protecting critical physical assets globally.
                </p>
              </div>
            </div>

            {/* Strategic layout pipeline */}
            <details open className="group border border-neutral-200 rounded-2xl bg-white overflow-hidden shadow-sm">
              <summary className="flex justify-between items-center p-4 cursor-pointer font-display font-extrabold text-xs tracking-wider uppercase text-neutral-400 list-none outline-none select-none hover:bg-neutral-50/50">
                <span>📍 Strategic Career Architecture Path</span>
                <ChevronDown className="w-4 h-4 text-neutral-400 group-open:rotate-180 transition-transform duration-200 rotate-180" />
              </summary>
              <div className="p-5 border-t border-neutral-100 bg-neutral-50/20 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white p-4 border border-neutral-200 rounded-xl space-y-1">
                    <span className="text-[10px] font-bold tracking-widest text-neutral-400 uppercase">Pre-Graduate Vectors</span>
                    <strong className="block text-xs text-neutral-800 leading-snug">BE EIE &rarr; Graduate Exam (GATE) &rarr; IISc (RBCCPS) / IIT Madras (M.Tech CPS)</strong>
                  </div>
                  <div className="bg-white p-4 border border-neutral-200 rounded-xl space-y-1">
                    <span className="text-[10px] font-bold tracking-widest text-neutral-400 uppercase">Target Sectors & Industrial Leaders</span>
                    <strong className="block text-xs text-neutral-800 leading-snug">Sectors: ISRO, BARC, Siemens India, Honeywell, Schneider Electric, ABB, Big 4 Infrastructure</strong>
                  </div>
                </div>
              </div>
            </details>

            {roadmapFocusWarning && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 text-amber-800 leading-relaxed transition">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-xs font-semibold">Multiple Vector Nodes Active</strong>
                  <p className="text-xs text-amber-700 mt-0.5">
                    More than one roadmap coordinate is currently tagged "In Progress". Stave off system congestion by routing only singular priorities.
                  </p>
                </div>
              </div>
            )}

            {/* Year-by-year vectors */}
            <div className="grid grid-cols-1 gap-6">
              {['y1', 'y2', 'y3', 'y4'].map(yr => {
                const listItems = state.roadmap[yr] || [];
                const doneCount = listItems.filter(x => x.status === 'done').length;
                const totalCount = listItems.length;
                const progressPct = totalCount ? Math.round((doneCount / totalCount) * 100) : 0;
                
                return (
                  <article key={yr} className="bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-sm">
                    <div className="flex justify-between items-center mb-1">
                      <h3 className="font-display font-extrabold text-sm text-neutral-950 capitalize">
                        Level {yr.replace('y', 'Year ')} Vector Pipeline
                      </h3>
                      <span className="font-mono text-xs font-bold text-neutral-500">
                        {doneCount}/{totalCount} Completed
                      </span>
                    </div>

                    <div className="w-full h-1 bg-neutral-100 rounded-full overflow-hidden mb-4">
                      <div className="h-full bg-brand-purple rounded-full transition-all duration-300" style={{ width: `${progressPct}%` }} />
                    </div>

                    {/* Nodes list */}
                    <div className="space-y-1.5 mb-4 max-h-[250px] overflow-y-auto pr-1">
                      {listItems.map((item, index) => (
                        <div key={item.id} className="flex justify-between items-center p-2.5 border border-neutral-100 bg-neutral-50/10 rounded-xl hover:bg-neutral-50/30 transition">
                          <div className="min-w-0 pr-2">
                            <span className={`text-xs font-semibold break-words block ${item.status === 'done' ? 'line-through text-neutral-400' : 'text-neutral-700'}`}>
                              {item.title}
                            </span>
                          </div>

                          <div className="flex items-center gap-2shrink-0">
                            <select
                              value={item.status}
                              onChange={(e) => handleTaskStatusChange(item.id, `road.${yr}`, e.target.value as any)}
                              className={`text-[9px] font-bold py-1 px-1.5 border rounded-lg ${
                                item.status === 'done' ? 'text-brand-emerald bg-emerald-50 border-emerald-100' : item.status === 'in_progress' ? 'text-brand-amber bg-amber-50 border-amber-100' : 'text-neutral-500 bg-white border-neutral-200'
                              }`}
                            >
                              <option value="pending">Pending</option>
                              <option value="in_progress">In Progress</option>
                              <option value="done">Done</option>
                            </select>

                            {item.custom && (
                              <button onClick={() => handleItemDelete(item.id, `road.${yr}`)} className="text-neutral-300 hover:text-red-500 p-0.5">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Add action inline */}
                    <div className="border-t border-neutral-100 pt-3 flex gap-2">
                      <input
                        type="text"
                        value={roadmapInputs[yr] || ''}
                        onChange={(e) => setRoadmapInputs(prev => ({ ...prev, [yr]: e.target.value }))}
                        placeholder="Add custom vector node..."
                        className="flex-1 bg-neutral-50/50 border border-neutral-200 px-3 py-1.5 rounded-xl text-xs focus:outline-none"
                      />
                      <button onClick={() => handleAddRoadmapMilestone(yr)} className="bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs px-4 py-2 rounded-xl transition">
                        Insert Node
                      </button>
                    </div>

                  </article>
                );
              })}
            </div>

          </div>
        )}


        {/* ==================== PANEL: NOTES Scratchpad ==================== */}
        {activeTab === 'notes' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
            
            <article className="bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="font-display font-extrabold text-base text-neutral-950 flex items-center gap-2">
                    ✍️ Scratchpad Buffer
                  </h2>
                  <p className="text-xs text-neutral-400 mt-0.5">Temporary caching workspace. Data is saved in memory buffers.</p>
                </div>
                <span className="font-mono text-xs text-neutral-400">
                  {scratchMemo.trim() ? `${scratchMemo.trim().split(/\s+/).length} words` : 'Empty buffer'}
                </span>
              </div>

              <form onSubmit={handleSaveScratchpad}>
                <textarea
                  value={scratchMemo}
                  onChange={(e) => setScratchMemo(e.target.value)}
                  placeholder="Draft configurations, IP coordinates, Wireshark packet payloads, or Modbus commands..."
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-brand-purple min-h-[140px] resize-y mb-4"
                />
                
                <button
                  type="submit"
                  disabled={!scratchMemo.trim()}
                  className={`font-semibold text-xs px-6 py-2.5 rounded-xl flex items-center gap-1.5 shadow-sm active:scale-95 transition ${
                    scratchMemo.trim()
                      ? 'bg-neutral-900 text-white hover:bg-neutral-800'
                      : 'bg-neutral-100 text-neutral-300 cursor-not-allowed'
                  }`}
                >
                  <Plus className="w-4 h-4 shrink-0" /> Flush Memo to Scratch Deck
                </button>
              </form>
            </article>

            {/* Saved list */}
            <div>
              <h3 className="font-display font-extrabold text-xs tracking-wider text-neutral-400 uppercase mb-3">
                Saved scratch memos ({state.notes.length})
              </h3>

              <div className="space-y-3">
                {state.notes.map((note, idx) => (
                  <div key={idx} className="bg-white border border-neutral-200/80 rounded-2xl p-4 shadow-sm relative overflow-hidden group">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-cyan" />
                    <p className="text-neutral-700 text-xs leading-relaxed whitespace-pre-wrap mb-4">
                      {note.text}
                    </p>
                    <div className="flex justify-between items-center border-t border-neutral-50 pt-2 text-[10px] text-neutral-400 font-medium">
                      <span>⏰ Recorded: {note.date}</span>
                      <button onClick={() => handlePurgeNote(idx)} className="text-neutral-400 hover:text-red-500 font-bold flex items-center gap-1">
                        <Trash2 className="w-3.5 h-3.5" /> Purge
                      </button>
                    </div>
                  </div>
                ))}

                {state.notes.length === 0 && (
                  <div className="py-12 bg-neutral-50/50 border border-dashed border-neutral-200 rounded-2xl text-center">
                    <p className="text-neutral-400 text-xs">A pristine cache. Write your first memo buffer above to persist insight.</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        )}


        {/* ==================== PANEL: GATE PREPARATION ==================== */}
        {activeTab === 'gate' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
            
            {/* Academic stats cards */}
            <article className="bg-[#fbfcff] border border-[rgba(99,102,241,0.08)] bg-gradient-to-tr from-indigo-50/10 to-transparent rounded-2xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-3">
                <h2 className="font-display font-extrabold text-base text-neutral-950 flex items-center gap-2">
                  🎓 GATE EE / IN Academic Strategy
                </h2>
                <span className="py-1 px-3 text-[10px] font-bold text-neutral-500 bg-neutral-100 rounded-full font-mono">
                  EXAM PREPARATION WORKSPACE
                </span>
              </div>
              <p className="text-xs text-neutral-600 leading-relaxed mb-4">
                Structuring core technical coordinates. Evaluating individual capability parameters: **Confidence Factor (CF) stars 1-5** (representing theoretical competence) versus **PyQ accuracy rate** (representing functional exam simulation yield).
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-neutral-100 pt-4">
                <div className="bg-white border rounded-xl p-3">
                  <span className="block text-[10px] uppercase font-semibold text-neutral-400 tracking-wider">Level I Theory</span>
                  <strong className="block text-xs text-neutral-800 font-display mt-0.5">Core College Rigorous Sync</strong>
                </div>
                <div className="bg-white border rounded-xl p-3">
                  <span className="block text-[10px] uppercase font-semibold text-neutral-400 tracking-wider">Level II Mock</span>
                  <strong className="block text-xs text-neutral-800 font-display mt-0.5">25+ Year Comprehensive PYQ</strong>
                </div>
                <div className="bg-white border rounded-xl p-3">
                  <span className="block text-[10px] uppercase font-semibold text-neutral-400 tracking-wider">Level III Timing</span>
                  <strong className="block text-xs text-neutral-800 font-display mt-0.5">Iterative Error work sheets</strong>
                </div>
              </div>
            </article>

            {/* SYLLABUS CONFIDENCE & SUBJECT TRACKER */}
            <article className="bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="font-display font-extrabold text-sm text-neutral-950">
                    🧩 Subjects Core trackers
                  </h2>
                  <p className="text-xs text-neutral-400 mt-0.5">Calibrate formulas and individual focus rates per syllabus module</p>
                </div>
              </div>

              {/* Subjects mapped loops */}
              <div className="divide-y divide-neutral-100">
                {state.subjects.map(sub => (
                  <div key={sub.id} className="py-4 first:pt-0 last:pb-0">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                      
                      <div className="md:col-span-6 space-y-2">
                        <div className="flex items-center justify-between">
                          <strong className="text-xs font-bold text-neutral-850 block">{sub.name}</strong>
                          {sub.custom && (
                            <button onClick={() => handleItemDelete(sub.id, 'subjects')} className="text-neutral-300 hover:text-red-500 rounded p-0.5">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                        <textarea
                          value={sub.notes}
                          onChange={(e) => handleUpdateSubjectNotes(sub.id, e.target.value)}
                          placeholder="Jot key formulas (e.g. state-transition matrices), textbook page markings, NPTEL modules references..."
                          className="w-full bg-neutral-50/50 border border-neutral-200 rounded-xl px-3 py-2 text-[11px] h-14 resize-none focus:outline-none"
                        />
                      </div>

                      <div className="md:col-span-6 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                        <div className="space-y-1">
                          <span className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest">CONFIDENCE LEVEL</span>
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map(starIdx => (
                              <button
                                key={starIdx}
                                type="button"
                                onClick={() => handleUpdateConfidence(sub.id, starIdx)}
                                className="focus:outline-none transition group"
                              >
                                <Star
                                  className={`w-5.5 h-5.5 ${
                                    starIdx <= sub.confidence
                                      ? 'text-amber-400 fill-amber-400'
                                      : 'text-neutral-200 hover:text-amber-200'
                                  }`}
                                />
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-1 w-full sm:w-auto">
                          <span className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest">PYQ ACCURACY YIELD (%)</span>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={sub.pyq || ''}
                              onChange={(e) => handleUpdatePyqRate(sub.id, Number(e.target.value))}
                              placeholder="0"
                              className="w-20 bg-neutral-50 border border-neutral-200 rounded-lg p-1.5 text-xs text-center font-mono font-bold"
                            />
                            <span className="text-xs text-neutral-400 font-mono">%</span>
                          </div>
                        </div>

                      </div>

                    </div>
                  </div>
                ))}
              </div>

              {/* Add custom subject */}
              <form onSubmit={handleAddCustomSubject} className="border-t border-neutral-100 pt-4 flex gap-2">
                <input
                  type="text"
                  value={newGateSub}
                  onChange={(e) => setNewGateSub(e.target.value)}
                  placeholder="Track custom syllabus node (e.g., Electromagnetic Fields...)"
                  className="flex-1 bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs focus:outline-none"
                />
                <button type="submit" className="bg-indigo-600 text-white font-bold text-xs px-5 py-2 rounded-xl hover:bg-indigo-700 transition">
                  Map Subject
                </button>
              </form>

            </article>

            {/* MOCK EXAM METRICS TRACKER CHART */}
            <article className="bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-sm">
              <div className="mb-4">
                <h2 className="font-display font-extrabold text-sm text-neutral-950 flex items-center gap-1.5">
                  <TrendingUp className="w-5 h-5 text-indigo-500" />
                  Mock Exam Metrics Scoreboard
                </h2>
                <p className="text-xs text-neutral-400 mt-0.5">Chronologically plotting simulated mock performance thresholds</p>
              </div>

              {/* Recharts Area Chart showing Mock Scores */}
              {processedScores.length > 0 ? (
                <div className="bg-neutral-50 border border-neutral-100 rounded-xl p-4 mb-5">
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={processedScores} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                        <defs>
                          <linearGradient id="scoreFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
                            <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eaf0f6" />
                        <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b', fontFamily: 'monospace' }} />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#64748b' }} unit="%" />
                        <RechartsTooltip
                          contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontFamily: 'sans-serif' }}
                          formatter={(value, name, props) => {
                            const item = props.payload;
                            return [`${item.score}/${item.maxScore} (${value}%)`, 'Performance Ratio'];
                          }}
                        />
                        <Area type="monotone" dataKey="percent" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#scoreFill)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  
                  {/* Performance stats summary */}
                  <div className="grid grid-cols-3 gap-4 border-t border-neutral-100 pt-4 text-center">
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-neutral-400">Total Simulated</span>
                      <strong className="block text-base font-extrabold font-display text-neutral-800">{processedScores.length} mocks</strong>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-neutral-400">Yield Average</span>
                      <strong className="block text-base font-extrabold font-display text-neutral-800">
                        {(() => {
                          const totalScore = processedScores.reduce((acc, x) => acc + x.score, 0);
                          const totalMax = processedScores.reduce((acc, x) => acc + x.maxScore, 0);
                          return totalMax > 0 ? `${Math.round((totalScore / totalMax) * 100)}%` : '0%';
                        })()}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-neutral-400">Best Performance</span>
                      <strong className="block text-base font-extrabold font-display text-neutral-800">
                        {(() => {
                          const maxPct = Math.max(...processedScores.map(x => x.percent));
                          const best = processedScores.find(x => x.percent === maxPct);
                          return best ? `${best.score}/${best.maxScore} (${best.percent}%)` : '0%';
                        })()}
                      </strong>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-12 bg-neutral-50/50 border border-dashed text-center rounded-xl my-4">
                  <p className="text-neutral-400 text-xs">No simulated scores charted. Register mock score coordinates below to plot charts.</p>
                </div>
              )}

              {/* Add core values */}
              <form onSubmit={handleRegisterMockScore} className="bg-neutral-50/50 border border-neutral-100 p-4 rounded-xl flex flex-col sm:flex-row gap-3 items-end sm:items-center">
                <div className="flex-1 w-full space-y-1">
                  <label className="text-[9.5px] font-bold text-neutral-400 tracking-wider uppercase block">Mock Assessment Date</label>
                  <input
                    type="date"
                    value={mockRegDate}
                    onChange={(e) => setMockRegDate(e.target.value)}
                    className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none"
                  />
                </div>
                <div className="w-full sm:w-28 space-y-1">
                  <label className="text-[9.5px] font-bold text-neutral-400 tracking-wider uppercase block">Score Obtained</label>
                  <input
                    type="number"
                    min="0"
                    value={mockRegScore}
                    onChange={(e) => setMockRegScore(e.target.value)}
                    placeholder="e.g. 74"
                    className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none"
                  />
                </div>
                <div className="w-full sm:w-28 space-y-1">
                  <label className="text-[9.5px] font-bold text-neutral-400 tracking-wider uppercase block">Max Points</label>
                  <input
                    type="number"
                    min="1"
                    value={mockRegMaxScore}
                    onChange={(e) => setMockRegMaxScore(e.target.value)}
                    placeholder="e.g. 100"
                    className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none"
                  />
                </div>
                <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl whitespace-nowrap w-full sm:w-auto h-9 mt-1 sm:mt-0 transition">
                  Register Score
                </button>
              </form>

              {/* Registered scores manager checklist */}
              {processedScores.length > 0 && (
                <div className="mt-5 border-t border-neutral-100 pt-4">
                  <h3 className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-3">Registered Mock Logs</h3>
                  <div className="flex flex-wrap gap-2">
                    {processedScores.map((sc, scIdx) => (
                      <div
                        key={scIdx}
                        className="flex items-center gap-2 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200/60 rounded-xl px-3 py-1.5 transition text-xs"
                      >
                        <span className="font-semibold text-neutral-800">
                          {sc.score}/{sc.maxScore} <span className="text-indigo-500 font-bold ml-0.5">({sc.percent}%)</span>
                        </span>
                        <span className="text-neutral-400 font-mono text-[10px]">{sc.date}</span>
                        <button
                          type="button"
                          onClick={() => handleDeleteMockScore(scIdx)}
                          className="text-neutral-300 hover:text-red-500 transition ml-1"
                          title="Delete score record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </article>

          </div>
        )}


        {/* ==================== PANEL: BIN Recycle ==================== */}
        {activeTab === 'restore' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
            <article className="bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="font-display font-extrabold text-base text-neutral-950 flex items-center gap-2">
                    ♻️ Workspace Recycle Bin
                  </h2>
                  <p className="text-xs text-neutral-400 mt-0.5">Memos and coordinates held for 24 hours of emergency restoration leeway</p>
                </div>
                <span className="py-1 px-3 text-[10px] font-bold text-red-700 bg-red-50 border border-red-100 rounded-xl font-mono">
                  24H EXPIRATION BUFFER
                </span>
              </div>

              {/* Mapped list items */}
              <div className="space-y-2 mb-6 max-h-[400px] overflow-y-auto pr-1">
                {state.restore.map(item => (
                  <div key={item.id} className="flex justify-between items-center p-3 border border-neutral-150 bg-neutral-50/40 rounded-xl hover:bg-neutral-50/70 transition">
                    <div className="min-w-0 pr-3">
                      <strong className="text-xs font-semibold text-neutral-800 block break-words">{item.label}</strong>
                      <span className="inline-block font-mono text-[9px] text-red-500 font-bold tracking-wider rounded uppercase mt-1">
                        Sourced: {item.source} // {getExpiresTimer(item.expiresAt)} remaining
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleRecoverBinItem(item.id)}
                        className="bg-white hover:bg-neutral-50 text-neutral-600 border border-neutral-200 rounded-lg py-1.5 px-3 text-[11px] font-extrabold transition active:scale-95 shadow-sm"
                      >
                        Recover
                      </button>
                      <button
                        onClick={() => handlePurgeBinPermanent(item.id)}
                        className="p-1 px-1.5 text-neutral-300 hover:text-red-500 hover:bg-red-50 border border-transparent rounded-lg transition"
                        title="Delete Permanently"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

                {state.restore.length === 0 && (
                  <div className="py-14 bg-neutral-50/30 border border-dashed border-neutral-200 rounded-2xl text-center">
                    <p className="text-neutral-400 text-xs leading-relaxed">🍃 Bin is immaculate. Clear skies.</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 border-t border-neutral-100 pt-4">
                <button
                  onClick={handleRetrieveAllBin}
                  disabled={state.restore.length === 0}
                  className={`py-2 px-4 rounded-xl text-xs font-bold transition text-center flex items-center justify-center gap-1.5 ${
                    state.restore.length > 0
                      ? 'bg-neutral-900 hover:bg-neutral-800 text-white cursor-pointer'
                      : 'bg-neutral-100 text-neutral-300 cursor-not-allowed'
                  }`}
                >
                  <RefreshCw className="w-4 h-4 shrink-0" /> Retrieve Outstanding Items
                </button>
                <button
                  onClick={handlePurgeAllBin}
                  disabled={state.restore.length === 0}
                  className={`py-2 px-4 rounded-xl text-xs font-bold transition text-center flex items-center justify-center gap-1.5 ${
                    state.restore.length > 0
                      ? confirmEmptyBin
                        ? 'bg-red-600 hover:bg-red-700 text-white cursor-pointer border border-red-600 animate-pulse'
                        : 'bg-red-50 hover:bg-red-100 text-red-700 cursor-pointer border border-red-200'
                      : 'bg-neutral-100 text-neutral-300 cursor-not-allowed'
                  }`}
                >
                  <Trash2 className="w-4 h-4 shrink-0" /> {confirmEmptyBin ? 'Confirm Purge Bin?' : 'Erase Entire Bin Cache'}
                </button>
              </div>

            </article>
          </div>
        )}


        {/* ==================== PANEL: DATA SETTINGS ==================== */}
        {activeTab === 'data' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
            <article className="bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-sm">
              <h2 className="font-display font-extrabold text-base text-neutral-950 flex items-center gap-2 mb-2">
                💾 System Data Engine
              </h2>
              <p className="text-xs text-neutral-400 mb-4 leading-relaxed">
                Backup and restore options are synced natively inside your local sandbox. Hard configurations can be backed up as portable databases.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Export backup */}
                <div className="border border-neutral-200/70 p-4 rounded-xl space-y-3">
                  <div>
                    <strong className="text-xs font-bold text-neutral-800 block">Create JSON backup</strong>
                    <span className="text-[10px] text-neutral-400 mt-0.5 block leading-normal">
                      Saves all today coordinates, custom notes backlog, roadmap pipelines, and simulated stats as a structured static file.
                    </span>
                  </div>
                  <button onClick={handleExportBackup} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 px-4 rounded-xl transition">
                    Export backup file
                  </button>
                </div>

                {/* Import backup */}
                <div className="border border-neutral-200/70 p-4 rounded-xl space-y-3">
                  <div>
                    <strong className="text-xs font-bold text-neutral-800 block">Restore background backup</strong>
                    <span className="text-[10px] text-neutral-400 mt-0.5 block leading-normal">
                      Inserts older templates. Acknowledging imports overwrite some active elements inside current caches.
                    </span>
                  </div>
                  <label className="w-full bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition text-center block cursor-pointer">
                    Upload configuration .json
                    <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
                  </label>
                </div>

              </div>

              {/* Wipe zone */}
              <div className="border border-red-200/60 bg-red-50/20 p-5 rounded-xl space-y-3 mt-6">
                <div>
                  <strong className="text-xs font-bold text-red-750 text-red-700 block">System Reset &amp; Clean Wipe</strong>
                  <span className="text-[10.5px] text-neutral-400 mt-0.5 block leading-relaxed">
                    Instantly wipes all mock score progress tables, habit lists, personal memos, and GATE subject logs. This operation is non-recoverable!
                  </span>
                </div>
                <button
                  onClick={handleEraseEverything}
                  className={`font-bold text-xs py-2.5 px-6 rounded-xl transition ${
                    confirmWipeAll
                      ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse'
                      : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                  }`}
                >
                  {confirmWipeAll ? '⚠️ Confirm Complete Database Reset?' : 'Hard erase user database'}
                </button>
              </div>

            </article>
          </div>
        )}

      </main>

      {/* --- HUD DEEP PERSISTENCE INTEGRATED TOASTER FLOATER --- */}
      <div
        className={`fixed left-1/2 bottom-6 -translate-x-1/2 flex items-center gap-2.5 bg-neutral-900/95 text-white py-2.5 px-5 rounded-xl shadow-xl border border-neutral-800 backdrop-blur-md z-[99999] transition-all duration-300 pointer-events-none ${
          toast.active ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
        }`}
      >
        <span className="text-sm">{toast.icon}</span>
        <span className="font-display font-semibold text-xs leading-none">{toast.message}</span>
      </div>

    </div>
  );
}
