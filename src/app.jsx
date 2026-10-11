const { useState, useEffect } = React;
const COLS = [
  { k: 'todo', n: 'TO DO' },
  { k: 'doing', n: 'DOING' },
  { k: 'done', n: 'DONE' },
];
const PRI = ['', 'EASY', 'MID', 'BOSS'];
const CCOL = { todo: 'var(--a4)', doing: 'var(--a1)', done: 'var(--a3)' };
const PCOL = ['', '#0f9d74', '#cf8f00', '#e0246f'];
const BCOL = { first: 'var(--a1)', q10: 'var(--a2)', boss: 'var(--a3)', early: 'var(--a4)', s3: 'var(--hot)', s7: 'var(--a1)', first_blood: 'var(--a2)', algo_master: 'var(--a3)' };
// Badge: ikon bitmap 5x5 ("#" = pixel nyala). Aturan perolehan ada di backend (api/index.py)
const BADGES = [
  { c: 'first', n: 'QUEST PERTAMA', d: 'Selesaikan 1 tugas', m: '..#../.###./#####/.###./.#.#.' },
  { c: 'q10', n: 'RAJIN', d: 'Selesaikan 10 tugas', m: '.#.#./#####/#####/.###./..#..' },
  { c: 'boss', n: 'BOSS SLAYER', d: 'Kalahkan 1 tugas BOSS', m: '.###./#####/#.#.#/#####/.#.#.' },
  { c: 'early', n: 'ANTI KEBUT', d: '3 tugas selesai sebelum deadline', m: '...#./..##./.###./..##./.#...' },
  { c: 's3', n: 'API KECIL', d: 'Streak 3 hari', m: '..#../.##../.###./#####/.###.' },
  { c: 's7', n: 'RAJA STREAK', d: 'Streak 7 hari', m: '#.#.#/#####/#####/#####/.....' },
  { c: 'first_blood', n: 'FIRST BLOOD', d: 'Menangkan 1 battle', m: '..#../.###./#####/.###./#...#' },
  { c: 'algo_master', n: 'JAGO ALGORITMA', d: 'Menangkan 5 battle', m: '#####/.#.#./..#../.#.#./#####' },
];
const iso = (n) => new Date(Date.now() - new Date().getTimezoneOffset() * 6e4 + n * 864e5).toISOString().slice(0, 10);
const day = (d) => (d ? Math.round((new Date(d + 'T00:00:00') - new Date(new Date().toDateString())) / 864e5) : null);
const lbl = (d) => {
  const n = day(d);
  return n === null ? 'tanpa deadline' : n < 0 ? `TELAT ${-n} hari` : n === 0 ? 'HARI INI!' : `H-${n}`;
};

// ---- Mode demo: dipakai otomatis kalau backend /api tidak ada (mis. file dibuka langsung) ----
let demo = {
  user: null,
  tasks: [
    { id: 'd1', title: 'Laporan Praktikum Basis Data', subject: 'Basis Data', deadline: iso(1), priority: 3, status: 'doing', notes: 'Bab ERD + normalisasi' },
    { id: 'd2', title: 'Rangkuman Jurnal Sistem Operasi', subject: 'Sistem Operasi', deadline: iso(5), priority: 2, status: 'todo', notes: '' },
    { id: 'd3', title: 'Quiz Kalkulus 2', subject: 'Kalkulus', deadline: iso(-1), priority: 1, status: 'done', notes: '' },
  ],
};
const demoMe = () => {
  const dn = demo.tasks.filter((t) => t.status === 'done').length;
  const days = [iso(-2), iso(-1), ...(dn ? [iso(0)] : [])];
  return { user: { username: demo.user }, days, streak: days.length, best: days.length, new: [], earned: [...(dn ? ['first'] : []), ...(days.length >= 3 ? ['s3'] : [])] };
};
function fake(m, p, b) {
  const ok = (d) => ({ ok: true, status: 200, data: d });
  if (p === '/register' || p === '/login') {
    demo.user = b.username || 'demo';
    return ok({ user: { username: demo.user } });
  }
  if (p === '/logout') {
    demo.user = null;
    return ok({});
  }
  if (!demo.user) return { ok: false, status: 401, data: { error: 'belum login' } };
  if (p.startsWith('/me')) return ok(demoMe());
  if (p === '/battles') return ok({ incoming: [], outgoing: [], active: [] });
  if (p === '/battles/history') return ok([]);
  const id = p.split('/')[2];
  if (m === 'GET') return ok([...demo.tasks]);
  if (m === 'POST') demo.tasks.push({ ...b, id: 'd' + Date.now(), status: 'todo' });
  if (m === 'PUT') demo.tasks = demo.tasks.map((t) => (t.id === id ? { ...t, ...b } : t));
  if (m === 'DELETE') demo.tasks = demo.tasks.filter((t) => t.id !== id);
  return ok({});
}
async function api(method, path, body) {
  try {
    const r = await fetch('/api' + path, { method, headers: { 'Content-Type': 'application/json' }, body: body && JSON.stringify(body) });
    const data = await r.json();
    window.__off = false;
    return { ok: r.ok, status: r.status, data };
  } catch {
    window.__off = true;
    return fake(method, path, body);
  }
}

const Pix = ({ m, z = 40, col = 'var(--fg)' }) => (
  <div className="grid grid-cols-5 mx-auto" style={{ width: z, height: z }}>
    {m
      .replace(/\//g, '')
      .split('')
      .map((c, i) => (
        <div key={i} style={{ background: c === '#' ? col : 'transparent' }} />
      ))}
  </div>
);

function Pomo() {
  const [s, setS] = useState(1500),
    [on, setOn] = useState(false);
  useEffect(() => {
    if (!on) return;
    const i = setInterval(() => setS((x) => x - 1), 1000);
    return () => clearInterval(i);
  }, [on]);
  useEffect(() => {
    if (s <= 0) {
      setOn(false);
      setS(1500);
    }
  }, [s]);
  const p = (n) => String(n).padStart(2, '0');
  return (
    <div className="px p-4 text-center">
      <div className="h text-xs mb-2">FOCUS MODE</div>
      <div className="h text-3xl mb-3">
        {p(Math.floor(s / 60))}:{p(s % 60)}
      </div>
      <button className="btn mr-2" onClick={() => setOn(!on)}>
        {on ? 'PAUSE' : 'START'}
      </button>
      <button
        className="btn"
        onClick={() => {
          setOn(false);
          setS(1500);
        }}
      >
        RESET
      </button>
    </div>
  );
}

function Auth({ done, off }) {
  const [mode, setMode] = useState('login'),
    [u, setU] = useState(''),
    [p, setP] = useState(''),
    [err, setErr] = useState('');
  const go = async (e) => {
    e.preventDefault();
    const r = await api('POST', '/' + mode, { username: u, password: p });
    r.ok ? done() : setErr(r.data.error || 'gagal, coba lagi');
  };
  return (
    <main className="grid place-items-center p-4" style={{ minHeight: '100dvh' }}>
      <form onSubmit={go} className="px p-6 w-full max-w-md grid gap-4">
        <h1 className="h logo text-xl sm:text-2xl text-center">
          STUDYTASK<span className="blink">_</span>
        </h1>
        <p className="text-center opacity-80">PRESS START — masuk untuk lanjut quest</p>
        <div className="flex gap-2">
          {['login', 'register'].map((m) => (
            <button
              type="button"
              key={m}
              className="btn flex-1"
              style={mode === m ? { background: 'var(--a1)', color: 'var(--ink)', borderColor: 'var(--a1)' } : {}}
              onClick={() => {
                setMode(m);
                setErr('');
              }}
            >
              {m === 'login' ? 'LOGIN' : 'DAFTAR'}
            </button>
          ))}
        </div>
        <input placeholder="username" value={u} onChange={(e) => setU(e.target.value)} autoComplete="username" />
        <input type="password" placeholder="password (min 6)" value={p} onChange={(e) => setP(e.target.value)} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
        {err && <div className="blink">! {err}</div>}
        <button className="btn pri py-3">{mode === 'login' ? '▶ MASUK' : '▶ BUAT AKUN'}</button>
        {off && <div className="opacity-60 text-center">demo mode: isi username/password bebas</div>}
      </form>
      <a href="/" className="h text-[9px] mt-4 opacity-70">
        ← BERANDA
      </a>
    </main>
  );
}

function Friends() {
  const [data, setData] = useState({ friends: [], incoming: [], outgoing: [] });
  const [uname, setUname] = useState(''),
    [msg, setMsg] = useState('');
  const load = async () => {
    const r = await api('GET', '/friends');
    if (r.ok) setData(r.data);
  };
  useEffect(() => {
    load();
    const i = setInterval(load, 2000);
    return () => clearInterval(i);
  }, []);
  const send = async (e) => {
    e.preventDefault();
    if (!uname.trim()) return;
    const r = await api('POST', '/friends/request', { username: uname.trim() });
    setMsg(r.ok ? (r.data.auto_accepted ? 'Langsung tersambung! Kalian udah saling nge-add.' : 'Permintaan terkirim!') : r.data.error || 'Gagal, coba lagi');
    if (r.ok) {
      setUname('');
      load();
    }
    setTimeout(() => setMsg(''), 3500);
  };
  const respond = async (id, action) => {
    await api('POST', '/friends/respond', { request_id: id, action });
    load();
  };
  const remove = async (username) => {
    await api('POST', '/friends/remove', { username });
    load();
  };

  return (
    <div className="px p-4 mb-6">
      <div className="h text-xs mb-4">TEMAN</div>
      <form onSubmit={send} className="flex gap-2 mb-3">
        <input placeholder="username teman" value={uname} onChange={(e) => setUname(e.target.value)} />
        <button className="btn pri">TAMBAH</button>
      </form>
      {msg && <div className="mb-3">{msg}</div>}

      {data.incoming.length > 0 && (
        <div className="mb-4">
          <div className="h text-[10px] mb-2">PERMINTAAN MASUK</div>
          {data.incoming.map((r) => (
            <div key={r.id} className="flex items-center justify-between gap-2 mb-2 flex-wrap">
              <span className="tag">{r.username}</span>
              <div className="flex gap-1">
                <button className="btn" onClick={() => respond(r.id, 'accept')}>
                  TERIMA
                </button>
                <button className="btn" onClick={() => respond(r.id, 'decline')}>
                  TOLAK
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="h text-[10px] mb-2">DAFTAR TEMAN ({data.friends.length})</div>
      {!data.friends.length && <div className="opacity-50">belum ada teman, coba tambah di atas</div>}
      {data.friends.map((f) => (
        <div key={f.username} className="flex items-center justify-between gap-2 mb-2 flex-wrap">
          <span className="tag">{f.username}</span>
          <button className="btn" onClick={() => remove(f.username)}>
            HAPUS
          </button>
        </div>
      ))}

      {data.outgoing.length > 0 && <div className="opacity-60 mt-3">menunggu diterima: {data.outgoing.map((o) => o.username).join(', ')}</div>}
    </div>
  );
}

function BattleArena() {
  const [data, setData] = useState({ incoming: [], outgoing: [], active: [] }),
    [history, setHistory] = useState([]),
    [battle, setBattle] = useState(null);
  const [uname, setUname] = useState(''),
    [msg, setMsg] = useState(''),
    [tick, setTick] = useState(Date.now());
  const load = async () => {
    const r = await api('GET', '/battles'),
      h = await api('GET', '/battles/history');
    if (!r.ok) return;
    setData(r.data);
    if (h.ok) setHistory(h.data);
    if (r.data.active.length) setBattleId((current) => current || r.data.active[0]);
  };
  const [battleId, setBattleId] = useState(null);
  const loadBattle = async (id) => {
    const r = await api('GET', '/battles/' + id);
    if (r.ok) setBattle(r.data);
    else setBattle(null);
  };
  useEffect(() => {
    load();
    const i = setInterval(load, 2000);
    return () => clearInterval(i);
  }, []);
  useEffect(() => {
    if (!battleId) return;
    loadBattle(battleId);
    const i = setInterval(() => loadBattle(battleId), 1000);
    return () => clearInterval(i);
  }, [battleId]);
  useEffect(() => {
    const i = setInterval(() => setTick(Date.now()), 250);
    return () => clearInterval(i);
  }, []);
  const challenge = async (e) => {
    e.preventDefault();
    const r = await api('POST', '/battles/challenge', { username: uname.trim() });
    setMsg(r.ok ? 'Tantangan terkirim!' : r.data.error || 'Gagal mengirim tantangan');
    if (r.ok) {
      setUname('');
      load();
    }
  };
  const respond = async (id, action) => {
    const r = await api('POST', '/battles/respond', { battle_id: id, action });
    if (r.ok && action === 'accept') setBattleId(id);
    setMsg(r.ok ? (action === 'accept' ? 'Battle dimulai!' : 'Tantangan ditolak.') : r.data.error || 'Gagal');
    load();
  };
  const answer = async (choice) => {
    if (!battle || battle.your_answer) return;
    const r = await api('POST', '/battles/' + battle.id + '/answer', { question_index: battle.question.index, choice });
    if (r.ok) setBattle(r.data);
    else setMsg(r.data.error || 'Jawaban gagal');
  };
  const seconds = battle && battle.status === 'active' ? battle.remaining_seconds : 0;
  return (
    <section className="px p-4 mb-6">
      <div className="h text-xs mb-4">BATTLE ARENA</div>
      <form onSubmit={challenge} className="flex gap-2 mb-3">
        <input placeholder="username teman untuk ditantang" value={uname} onChange={(e) => setUname(e.target.value)} />
        <button className="btn pri">TANTANG</button>
      </form>
      {msg && <div className="mb-3">{msg}</div>}
      {data.incoming.length > 0 && (
        <div className="mb-4">
          <div className="h text-[10px] mb-2">TANTANGAN MASUK</div>
          {data.incoming.map((x) => (
            <div key={x.id} className="flex items-center justify-between gap-2 mb-2 flex-wrap">
              <span className="tag">{x.username}</span>
              <div className="flex gap-1">
                <button className="btn" onClick={() => respond(x.id, 'accept')}>
                  TERIMA
                </button>
                <button className="btn" onClick={() => respond(x.id, 'decline')}>
                  TOLAK
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {battle && battle.status === 'active' && (
        <div className="card p-4 mb-4">
          <div className="flex justify-between gap-2 flex-wrap">
            <span className="h text-[10px]">
              {battle.you.username} {battle.you.score} — {battle.opponent.score} {battle.opponent.username}
            </span>
            <span className="h text-xs" style={{ color: seconds <= 5 ? 'var(--a2)' : 'var(--ink)' }}>
              00:{String(seconds).padStart(2, '0')}
            </span>
          </div>
          <div className="h text-[9px] mt-4 mb-3">
            SOAL {battle.current_question + 1}/{battle.total_questions}
          </div>
          <div className="h text-xs leading-6 mb-4">{battle.question.prompt}</div>
          <div className="grid sm:grid-cols-2 gap-2">
            {battle.question.options.map((option, index) => (
              <button
                key={option}
                className="btn text-left"
                disabled={!!battle.your_answer || seconds === 0}
                style={battle.your_answer && battle.your_answer.choice === index ? { background: 'var(--a1)', color: 'var(--ink)' } : {}}
                onClick={() => answer(index)}
              >
                {String.fromCharCode(65 + index)}. {option}
              </button>
            ))}
          </div>
          {battle.opponent_answered && !battle.your_answer && <div className="mt-3">Lawan sudah menjawab. Kejar!</div>}
        </div>
      )}
      {battle && battle.status === 'finished' && (
        <div className="card p-4 mb-4">
          <div className="h text-xs mb-2">BATTLE SELESAI</div>
          <div>{battle.winner ? 'PEMENANG: ' + battle.winner : 'HASIL IMBANG'}</div>
          <div>
            {battle.you.username} {battle.you.score} — {battle.opponent.score} {battle.opponent.username}
          </div>
          <button
            className="btn mt-3"
            onClick={() => {
              setBattle(null);
              setBattleId(null);
              load();
            }}
          >
            TUTUP
          </button>
        </div>
      )}
      {data.outgoing.length > 0 && <div className="opacity-60 mb-3">menunggu tantangan diterima: {data.outgoing.map((x) => x.username).join(', ')}</div>}
      {!battle && data.active.length === 0 && <div className="opacity-50">Tantang teman untuk memulai race 5 soal algoritma.</div>}
      {history.length > 0 && (
        <div className="mt-4">
          <div className="h text-[10px] mb-2">RIWAYAT BATTLE</div>
          {history.map((x) => (
            <div key={x.id} className="flex justify-between gap-2 mb-1">
              <span>
                {x.challenger} vs {x.opponent}
              </span>
              <span>
                {x.winner ? 'MENANG: ' + x.winner : 'SERI'} · {x.your_score}-{x.opponent_score}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function Board({ me, refresh, logout }) {
  const empty = { title: '', subject: '', deadline: '', priority: 1, notes: '' };
  const [tasks, setTasks] = useState([]),
    [f, setF] = useState(empty),
    [eid, setEid] = useState(null);
  const [q, setQ] = useState(''),
    [sure, setSure] = useState(null),
    [toast, setToast] = useState(''),
    [tab, setTab] = useState('todo');
  const load = async () => {
    const r = await api('GET', '/tasks');
    setTasks(Array.isArray(r.data) ? r.data : []);
    refresh();
  };
  useEffect(() => {
    load();
  }, []);
  useEffect(() => {
    if (me.new && me.new.length) {
      setToast('BADGE BARU: ' + me.new.map((c) => BADGES.find((b) => b.c === c).n).join(', '));
      setTimeout(() => setToast(''), 4500);
    }
  }, [me]);

  const save = async (e) => {
    e.preventDefault();
    if (!f.title.trim()) return;
    const { title, subject, deadline, priority, notes } = f,
      b = { title, subject, deadline, priority, notes };
    eid ? await api('PUT', '/tasks/' + eid, b) : await api('POST', '/tasks', b);
    setF(empty);
    setEid(null);
    load();
  };
  const move = async (t, d) => {
    const s = COLS[COLS.findIndex((c) => c.k === t.status) + d].k;
    await api('PUT', '/tasks/' + t.id, s === 'done' ? { status: s, done_at: iso(0) } : { status: s });
    load();
  };
  const edit = (t) => {
    setF({ ...empty, ...t });
    setEid(t.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const del = async (t) => {
    if (sure !== t.id) {
      setSure(t.id);
      return;
    }
    await api('DELETE', '/tasks/' + t.id);
    setSure(null);
    load();
  };

  const doneN = tasks.filter((t) => t.status === 'done').length;
  const xp = tasks.filter((t) => t.status === 'done').reduce((a, t) => a + t.priority * 10, 0);
  const late = tasks.filter((t) => t.status !== 'done' && day(t.deadline) < 0).length;
  const shown = tasks.filter((t) => (t.title + t.subject).toLowerCase().includes(q.toLowerCase()));
  const days = me.days || [];

  return (
    <main className="max-w-6xl 2xl:max-w-7xl mx-auto p-3 sm:p-4 md:p-8">
      <header className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <h1 className="h logo text-xl sm:text-3xl md:text-4xl">
            STUDYTASK<span className="blink">_</span>
          </h1>
          <p className="opacity-80">Quest board mahasiswa — selesaikan tugas, naik level.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <a href="/" className="btn">
            ← BERANDA
          </a>
          <button className="btn max-w-full truncate" onClick={logout}>
            LOGOUT @{me.user.username}
          </button>
        </div>
      </header>

      <section className="grid md:grid-cols-3 gap-4 sm:gap-6 mb-4 sm:mb-6">
        <div className="px p-4 md:col-span-2">
          <div className="h text-xs mb-3">PLAYER · LV {Math.floor(xp / 50) + 1}</div>
          <div className="flex gap-1 mb-1">
            {Array.from({ length: 10 }, (_, i) => (
              <div key={i} className={'seg ' + (i < (xp % 50) / 5 ? 'on' : '')} />
            ))}
          </div>
          <div className="mb-4">
            {xp % 50}/50 XP · {doneN} quest selesai · {late} telat
          </div>
          <div className="flex items-center gap-3 mb-2">
            <Pix m={BADGES[4].m} z={25} col="var(--hot)" />
            <span className="h text-xs">STREAK {me.streak} HARI</span>
            <span className="opacity-60">(terbaik: {me.best})</span>
          </div>
          <div className="flex gap-1">
            {Array.from({ length: 7 }, (_, i) => {
              const d = iso(i - 6);
              return <div key={d} title={d} className={'seg ' + (days.includes(d) ? 'on hot' : '')} />;
            })}
          </div>
          <div className="flex justify-between opacity-60 text-base">
            <span>6 hari lalu</span>
            <span>hari ini</span>
          </div>
        </div>
        <Pomo />
      </section>

      <section className="px p-4 mb-6">
        <div className="h text-xs mb-4">
          ACHIEVEMENTS {me.earned.length}/{BADGES.length}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {BADGES.map((b) => (
            <div key={b.c} className="text-center" style={me.earned.includes(b.c) ? {} : { opacity: 0.35, filter: 'grayscale(1)' }}>
              <Pix m={b.m} col={BCOL[b.c]} />
              <div className="h text-[8px] mt-2">{b.n}</div>
              <div className="text-base leading-4 mt-1">{b.d}</div>
            </div>
          ))}
        </div>
      </section>

      <Friends />
      <BattleArena />

      <form onSubmit={save} className="px p-4 grid md:grid-cols-6 gap-3 mb-6">
        <div className="h text-xs md:col-span-6">{eid ? '> EDIT QUEST' : '> QUEST BARU'}</div>
        <input className="md:col-span-3" placeholder="Judul tugas *" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
        <input className="md:col-span-3" placeholder="Mata kuliah" value={f.subject} onChange={(e) => setF({ ...f, subject: e.target.value })} />
        <input className="md:col-span-2" type="date" value={f.deadline || ''} onChange={(e) => setF({ ...f, deadline: e.target.value })} />
        <select className="md:col-span-1" value={f.priority} onChange={(e) => setF({ ...f, priority: +e.target.value })}>
          {[1, 2, 3].map((p) => (
            <option key={p} value={p}>
              {PRI[p]}
            </option>
          ))}
        </select>
        <input className="md:col-span-3" placeholder="Catatan (opsional)" value={f.notes || ''} onChange={(e) => setF({ ...f, notes: e.target.value })} />
        <div className="md:col-span-6 flex gap-3">
          <button className="btn pri flex-1 sm:flex-none">{eid ? 'UPDATE' : '+ TAMBAH'}</button>
          {eid && (
            <button
              type="button"
              className="btn"
              onClick={() => {
                setF(empty);
                setEid(null);
              }}
            >
              BATAL
            </button>
          )}
        </div>
      </form>

      <input className="mb-6" placeholder="cari judul / mata kuliah..." value={q} onChange={(e) => setQ(e.target.value)} />

      <div className="flex gap-2 mb-4 lg:hidden">
        {COLS.map((c) => (
          <button key={c.k} className="btn flex-1 px-1" onClick={() => setTab(c.k)} style={tab === c.k ? { background: CCOL[c.k], color: 'var(--ink)', borderColor: CCOL[c.k] } : {}}>
            {c.n} ({shown.filter((t) => t.status === c.k).length})
          </button>
        ))}
      </div>
      <section className="grid lg:grid-cols-3 gap-6">
        {COLS.map((c, ci) => {
          const list = shown.filter((t) => t.status === c.k).sort((a, b) => ((a.deadline || '9') > (b.deadline || '9') ? 1 : -1));
          return (
            <div key={c.k} className={(tab === c.k ? 'block' : 'hidden') + ' lg:block min-w-0'}>
              <div className="px p-2 h text-xs mb-4 hidden lg:block" style={{ borderColor: CCOL[c.k], color: CCOL[c.k] }}>
                {c.n} ({list.length})
              </div>
              {!list.length && <div className="opacity-50 text-center">-- kosong --</div>}
              <div className="grid md:grid-cols-2 lg:grid-cols-1 gap-4 items-start">
                {list.map((t) => {
                  const hot = t.status !== 'done' && day(t.deadline) !== null && day(t.deadline) <= 1;
                  return (
                    <div key={t.id} className="card p-3 min-w-0" style={{ borderTop: '10px solid ' + CCOL[c.k] }}>
                      <div className="flex justify-between gap-2">
                        <span className="tag truncate">{t.subject || 'UMUM'}</span>
                        <span style={{ color: PCOL[t.priority] }} title={PRI[t.priority]}>
                          {'■'.repeat(t.priority) + '□'.repeat(3 - t.priority)}
                        </span>
                      </div>
                      <div className="h text-[11px] my-2 break-words">{t.title}</div>
                      {t.notes && <div className="leading-5 mb-1 break-words">{t.notes}</div>}
                      <div className={hot ? 'blink font-bold late' : ''}>DEADLINE: {lbl(t.deadline)}</div>
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {ci > 0 && (
                          <button className="btn" onClick={() => move(t, -1)}>
                            ◀
                          </button>
                        )}
                        {ci < 2 && (
                          <button className="btn" onClick={() => move(t, 1)}>
                            ▶
                          </button>
                        )}
                        <button className="btn" onClick={() => edit(t)}>
                          EDIT
                        </button>
                        <button className="btn" onClick={() => del(t)}>
                          {sure === t.id ? 'YAKIN?' : 'DEL'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </section>
      <footer className="h text-[10px] text-center mt-10 opacity-60">© STUDYTASK · MADE FOR MAHASISWA</footer>
      {toast && <div className="toast h text-[10px] p-3 fixed bottom-3 left-3 right-3 sm:left-auto z-10 sm:max-w-xs">★ {toast}</div>}
    </main>
  );
}

function App() {
  // me=null -> anggap belum login & langsung tampilkan form Auth (sama seperti kerangka statis di index.html),
  // tanpa layar "LOADING" supaya konten pertama tidak menunggu network round-trip ke /api/me.
  const [me, setMe] = useState(null),
    [off, setOff] = useState(false);
  const refresh = async () => {
    const r = await api('GET', '/me?today=' + iso(0));
    setOff(!!window.__off);
    setMe(r.ok ? r.data : false);
  };
  useEffect(() => {
    refresh();
  }, []);
  const logout = async () => {
    await api('POST', '/logout');
    setMe(false);
  };
  return (
    <>
      {off && <div className="demo h text-[9px] text-center py-1 px-2">DEMO MODE — backend tidak terhubung, data hanya contoh</div>}
      {me && me.user ? <Board me={me} refresh={refresh} logout={logout} /> : <Auth done={refresh} off={off} />}
    </>
  );
}
ReactDOM.createRoot(document.getElementById('root')).render(<App />);
