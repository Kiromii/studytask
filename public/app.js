const { useState, useEffect } = React,
  COLS = [
    { k: 'todo', n: 'TO DO' },
    { k: 'doing', n: 'DOING' },
    { k: 'done', n: 'DONE' },
  ],
  PRI = ['', 'EASY', 'MID', 'BOSS'],
  CCOL = { todo: 'var(--a4)', doing: 'var(--a1)', done: 'var(--a3)' },
  PCOL = ['', '#0f9d74', '#cf8f00', '#e0246f'],
  BCOL = { first: 'var(--a1)', q10: 'var(--a2)', boss: 'var(--a3)', early: 'var(--a4)', s3: 'var(--hot)', s7: 'var(--a1)', first_blood: 'var(--a2)', algo_master: 'var(--a3)' },
  BADGES = [
    { c: 'first', n: 'QUEST PERTAMA', d: 'Selesaikan 1 tugas', m: '..#../.###./#####/.###./.#.#.' },
    { c: 'q10', n: 'RAJIN', d: 'Selesaikan 10 tugas', m: '.#.#./#####/#####/.###./..#..' },
    { c: 'boss', n: 'BOSS SLAYER', d: 'Kalahkan 1 tugas BOSS', m: '.###./#####/#.#.#/#####/.#.#.' },
    { c: 'early', n: 'ANTI KEBUT', d: '3 tugas selesai sebelum deadline', m: '...#./..##./.###./..##./.#...' },
    { c: 's3', n: 'API KECIL', d: 'Streak 3 hari', m: '..#../.##../.###./#####/.###.' },
    { c: 's7', n: 'RAJA STREAK', d: 'Streak 7 hari', m: '#.#.#/#####/#####/#####/.....' },
    { c: 'first_blood', n: 'FIRST BLOOD', d: 'Menangkan 1 battle', m: '..#../.###./#####/.###./#...#' },
    { c: 'algo_master', n: 'JAGO ALGORITMA', d: 'Menangkan 5 battle', m: '#####/.#.#./..#../.#.#./#####' },
  ],
  iso = (a) => new Date(Date.now() - new Date().getTimezoneOffset() * 6e4 + a * 864e5).toISOString().slice(0, 10),
  day = (a) => (a ? Math.round((new Date(a + 'T00:00:00') - new Date(new Date().toDateString())) / 864e5) : null),
  lbl = (a) => {
    const t = day(a);
    return t === null ? 'tanpa deadline' : t < 0 ? `TELAT ${-t} hari` : t === 0 ? 'HARI INI!' : `H-${t}`;
  };
let demo = {
  user: null,
  tasks: [
    { id: 'd1', title: 'Laporan Praktikum Basis Data', subject: 'Basis Data', deadline: iso(1), priority: 3, status: 'doing', notes: 'Bab ERD + normalisasi' },
    { id: 'd2', title: 'Rangkuman Jurnal Sistem Operasi', subject: 'Sistem Operasi', deadline: iso(5), priority: 2, status: 'todo', notes: '' },
    { id: 'd3', title: 'Quiz Kalkulus 2', subject: 'Kalkulus', deadline: iso(-1), priority: 1, status: 'done', notes: '' },
  ],
};
const demoMe = () => {
  const a = demo.tasks.filter((s) => s.status === 'done').length,
    t = [iso(-2), iso(-1), ...(a ? [iso(0)] : [])];
  return { user: { username: demo.user }, days: t, streak: t.length, best: t.length, new: [], earned: [...(a ? ['first'] : []), ...(t.length >= 3 ? ['s3'] : [])] };
};
function fake(a, t, s) {
  const n = (d) => ({ ok: !0, status: 200, data: d });
  if (t === '/register' || t === '/login') return ((demo.user = s.username || 'demo'), n({ user: { username: demo.user } }));
  if (t === '/logout') return ((demo.user = null), n({}));
  if (!demo.user) return { ok: !1, status: 401, data: { error: 'belum login' } };
  if (t.startsWith('/me')) return n(demoMe());
  if (t === '/battles') return n({ incoming: [], outgoing: [], active: [] });
  if (t === '/battles/history') return n([]);
  const r = t.split('/')[2];
  return a === 'GET'
    ? n([...demo.tasks])
    : (a === 'POST' && demo.tasks.push({ ...s, id: 'd' + Date.now(), status: 'todo' }),
      a === 'PUT' && (demo.tasks = demo.tasks.map((d) => (d.id === r ? { ...d, ...s } : d))),
      a === 'DELETE' && (demo.tasks = demo.tasks.filter((d) => d.id !== r)),
      n({}));
}
async function api(a, t, s) {
  try {
    const n = await fetch('/api' + t, { method: a, headers: { 'Content-Type': 'application/json' }, body: s && JSON.stringify(s) }),
      r = await n.json();
    return ((window.__off = !1), { ok: n.ok, status: n.status, data: r });
  } catch (n) {
    return ((window.__off = !0), fake(a, t, s));
  }
}
const Pix = ({ m: a, z: t = 40, col: s = 'var(--fg)' }) =>
  React.createElement(
    'div',
    { className: 'grid grid-cols-5 mx-auto', style: { width: t, height: t } },
    a
      .replace(/\//g, '')
      .split('')
      .map((n, r) => React.createElement('div', { key: r, style: { background: n === '#' ? s : 'transparent' } })),
  );
function Pomo() {
  const [a, t] = useState(1500),
    [s, n] = useState(!1);
  (useEffect(() => {
    if (!s) return;
    const d = setInterval(() => t((o) => o - 1), 1e3);
    return () => clearInterval(d);
  }, [s]),
    useEffect(() => {
      a <= 0 && (n(!1), t(1500));
    }, [a]));
  const r = (d) => String(d).padStart(2, '0');
  return React.createElement(
    'div',
    { className: 'px p-4 text-center' },
    React.createElement('div', { className: 'h text-xs mb-2' }, 'FOCUS MODE'),
    React.createElement('div', { className: 'h text-3xl mb-3' }, r(Math.floor(a / 60)), ':', r(a % 60)),
    React.createElement('button', { className: 'btn mr-2', onClick: () => n(!s) }, s ? 'PAUSE' : 'START'),
    React.createElement(
      'button',
      {
        className: 'btn',
        onClick: () => {
          (n(!1), t(1500));
        },
      },
      'RESET',
    ),
  );
}
function Auth({ done: a, off: t }) {
  const [s, n] = useState('login'),
    [r, d] = useState(''),
    [o, p] = useState(''),
    [g, v] = useState('');
  return React.createElement(
    'main',
    { className: 'grid place-items-center p-4', style: { minHeight: '100dvh' } },
    React.createElement(
      'form',
      {
        onSubmit: async (c) => {
          c.preventDefault();
          const f = await api('POST', '/' + s, { username: r, password: o });
          f.ok ? a() : v(f.data.error || 'gagal, coba lagi');
        },
        className: 'px p-6 w-full max-w-md grid gap-4',
      },
      React.createElement('h1', { className: 'h logo text-xl sm:text-2xl text-center' }, 'STUDYTASK', React.createElement('span', { className: 'blink' }, '_')),
      React.createElement('p', { className: 'text-center opacity-80' }, 'PRESS START \u2014 masuk untuk lanjut quest'),
      React.createElement(
        'div',
        { className: 'flex gap-2' },
        ['login', 'register'].map((c) =>
          React.createElement(
            'button',
            {
              type: 'button',
              key: c,
              className: 'btn flex-1',
              style: s === c ? { background: 'var(--a1)', color: 'var(--ink)', borderColor: 'var(--a1)' } : {},
              onClick: () => {
                (n(c), v(''));
              },
            },
            c === 'login' ? 'LOGIN' : 'DAFTAR',
          ),
        ),
      ),
      React.createElement('input', { placeholder: 'username', value: r, onChange: (c) => d(c.target.value), autoComplete: 'username' }),
      React.createElement('input', { type: 'password', placeholder: 'password (min 6)', value: o, onChange: (c) => p(c.target.value), autoComplete: s === 'login' ? 'current-password' : 'new-password' }),
      g && React.createElement('div', { className: 'blink' }, '! ', g),
      React.createElement('button', { className: 'btn pri py-3' }, s === 'login' ? '\u25B6 MASUK' : '\u25B6 BUAT AKUN'),
      t && React.createElement('div', { className: 'opacity-60 text-center' }, 'demo mode: isi username/password bebas'),
    ),
    React.createElement('a', { href: '/', className: 'h text-[9px] mt-4 opacity-70' }, '\u2190 BERANDA'),
  );
}
function Friends() {
  const [a, t] = useState({ friends: [], incoming: [], outgoing: [] }),
    [s, n] = useState(''),
    [r, d] = useState(''),
    o = async () => {
      const l = await api('GET', '/friends');
      l.ok && t(l.data);
    };
  useEffect(() => {
    o();
  }, []);
  const p = async (l) => {
      if ((l.preventDefault(), !s.trim())) return;
      const c = await api('POST', '/friends/request', { username: s.trim() });
      (d(c.ok ? (c.data.auto_accepted ? 'Langsung tersambung! Kalian udah saling nge-add.' : 'Permintaan terkirim!') : c.data.error || 'Gagal, coba lagi'), c.ok && (n(''), o()), setTimeout(() => d(''), 3500));
    },
    g = async (l, c) => {
      (await api('POST', '/friends/respond', { request_id: l, action: c }), o());
    },
    v = async (l) => {
      (await api('POST', '/friends/remove', { username: l }), o());
    };
  return React.createElement(
    'div',
    { className: 'px p-4 mb-6' },
    React.createElement('div', { className: 'h text-xs mb-4' }, 'TEMAN'),
    React.createElement(
      'form',
      { onSubmit: p, className: 'flex gap-2 mb-3' },
      React.createElement('input', { placeholder: 'username teman', value: s, onChange: (l) => n(l.target.value) }),
      React.createElement('button', { className: 'btn pri' }, 'TAMBAH'),
    ),
    r && React.createElement('div', { className: 'mb-3' }, r),
    a.incoming.length > 0 &&
      React.createElement(
        'div',
        { className: 'mb-4' },
        React.createElement('div', { className: 'h text-[10px] mb-2' }, 'PERMINTAAN MASUK'),
        a.incoming.map((l) =>
          React.createElement(
            'div',
            { key: l.id, className: 'flex items-center justify-between gap-2 mb-2 flex-wrap' },
            React.createElement('span', { className: 'tag' }, l.username),
            React.createElement(
              'div',
              { className: 'flex gap-1' },
              React.createElement('button', { className: 'btn', onClick: () => g(l.id, 'accept') }, 'TERIMA'),
              React.createElement('button', { className: 'btn', onClick: () => g(l.id, 'decline') }, 'TOLAK'),
            ),
          ),
        ),
      ),
    React.createElement('div', { className: 'h text-[10px] mb-2' }, 'DAFTAR TEMAN (', a.friends.length, ')'),
    !a.friends.length && React.createElement('div', { className: 'opacity-50' }, 'belum ada teman, coba tambah di atas'),
    a.friends.map((l) =>
      React.createElement(
        'div',
        { key: l.username, className: 'flex items-center justify-between gap-2 mb-2 flex-wrap' },
        React.createElement('span', { className: 'tag' }, l.username),
        React.createElement('button', { className: 'btn', onClick: () => v(l.username) }, 'HAPUS'),
      ),
    ),
    a.outgoing.length > 0 && React.createElement('div', { className: 'opacity-60 mt-3' }, 'menunggu diterima: ', a.outgoing.map((l) => l.username).join(', ')),
  );
}
function BattleArena() {
  const [a, t] = useState({ incoming: [], outgoing: [], active: [] }),
    [history, b] = useState([]),
    [s, n] = useState(null),
    [r, d] = useState(null),
    [o, p] = useState(''),
    [g, v] = useState(''),
    [l, c] = useState(Date.now());
  const load = async () => {
      const e = await api('GET', '/battles'),
        m = await api('GET', '/battles/history');
      e.ok && (t(e.data), m.ok && b(m.data), e.data.active.length && !s && n(e.data.active[0]));
    },
    loadBattle = async (e) => {
      const m = await api('GET', '/battles/' + e);
      m.ok ? d(m.data) : d(null);
    };
  (useEffect(() => {
    load();
  }, []),
    useEffect(() => {
      if (!s) return;
      loadBattle(s);
      const e = setInterval(() => loadBattle(s), 1e3);
      return () => clearInterval(e);
    }, [s]),
    useEffect(() => {
      const e = setInterval(() => c(Date.now()), 250);
      return () => clearInterval(e);
    }, []));
  const h = async (e) => {
      e.preventDefault();
      const m = await api('POST', '/battles/challenge', { username: o.trim() });
      v(m.ok ? 'Tantangan terkirim!' : m.data.error || 'Gagal mengirim tantangan');
      m.ok && (p(''), load());
    },
    y = async (e, m) => {
      const u = await api('POST', '/battles/respond', { battle_id: e, action: m });
      (u.ok && m === 'accept' && n(e), v(u.ok ? (m === 'accept' ? 'Battle dimulai!' : 'Tantangan ditolak.') : u.data.error || 'Gagal'), load());
    },
    w = async (e) => {
      if (!r || r.your_answer) return;
      const m = await api('POST', '/battles/' + r.id + '/answer', { question_index: r.question.index, choice: e });
      m.ok ? d(m.data) : v(m.data.error || 'Jawaban gagal');
    },
    E = r && 'active' === r.status ? Math.max(0, r.time_limit - Math.floor((l - new Date(r.question_started_at).getTime()) / 1e3)) : 0,
    R = React.createElement;
  return R(
    'section',
    { className: 'px p-4 mb-6' },
    R('div', { className: 'h text-xs mb-4' }, 'BATTLE ARENA'),
    R('form', { onSubmit: h, className: 'flex gap-2 mb-3' }, R('input', { placeholder: 'username teman untuk ditantang', value: o, onChange: (e) => p(e.target.value) }), R('button', { className: 'btn pri' }, 'TANTANG')),
    g && R('div', { className: 'mb-3' }, g),
    a.incoming.length > 0 &&
      R(
        'div',
        { className: 'mb-4' },
        R('div', { className: 'h text-[10px] mb-2' }, 'TANTANGAN MASUK'),
        a.incoming.map((e) =>
          R(
            'div',
            { key: e.id, className: 'flex items-center justify-between gap-2 mb-2 flex-wrap' },
            R('span', { className: 'tag' }, e.username),
            R('div', { className: 'flex gap-1' }, R('button', { className: 'btn', onClick: () => y(e.id, 'accept') }, 'TERIMA'), R('button', { className: 'btn', onClick: () => y(e.id, 'decline') }, 'TOLAK')),
          ),
        ),
      ),
    r &&
      'active' === r.status &&
      R(
        'div',
        { className: 'card p-4 mb-4' },
        R(
          'div',
          { className: 'flex justify-between gap-2 flex-wrap' },
          R('span', { className: 'h text-[10px]' }, r.you.username, ' ', r.you.score, ' — ', r.opponent.score, ' ', r.opponent.username),
          R('span', { className: 'h text-xs', style: { color: E <= 5 ? 'var(--a2)' : 'var(--ink)' } }, '00:', String(E).padStart(2, '0')),
        ),
        R('div', { className: 'h text-[9px] mt-4 mb-3' }, 'SOAL ', r.current_question + 1, '/', r.total_questions),
        R('div', { className: 'h text-xs leading-6 mb-4' }, r.question.prompt),
        R(
          'div',
          { className: 'grid sm:grid-cols-2 gap-2' },
          r.question.options.map((e, m) =>
            R(
              'button',
              { key: e, className: 'btn text-left', disabled: !!r.your_answer || E === 0, style: r.your_answer && r.your_answer.choice === m ? { background: 'var(--a1)', color: 'var(--ink)' } : {}, onClick: () => w(m) },
              String.fromCharCode(65 + m),
              '. ',
              e,
            ),
          ),
        ),
        r.opponent_answered && !r.your_answer && R('div', { className: 'mt-3' }, 'Lawan sudah menjawab. Kejar!'),
      ),
    r &&
      'finished' === r.status &&
      R(
        'div',
        { className: 'card p-4 mb-4' },
        R('div', { className: 'h text-xs mb-2' }, 'BATTLE SELESAI'),
        R('div', null, r.winner ? 'PEMENANG: ' + r.winner : 'HASIL IMBANG'),
        R('div', null, r.you.username, ' ', r.you.score, ' — ', r.opponent.score, ' ', r.opponent.username),
        R(
          'button',
          {
            className: 'btn mt-3',
            onClick: () => {
              d(null);
              n(null);
              load();
            },
          },
          'TUTUP',
        ),
      ),
    a.outgoing.length > 0 && R('div', { className: 'opacity-60 mb-3' }, 'menunggu tantangan diterima: ', a.outgoing.map((e) => e.username).join(', ')),
    !r && 0 === a.active.length && R('div', { className: 'opacity-50' }, 'Tantang teman untuk memulai race 5 soal algoritma.'),
    history.length > 0 &&
      R(
        'div',
        { className: 'mt-4' },
        R('div', { className: 'h text-[10px] mb-2' }, 'RIWAYAT BATTLE'),
        history.map((e) =>
          R('div', { key: e.id, className: 'flex justify-between gap-2 mb-1' }, R('span', null, e.challenger, ' vs ', e.opponent), R('span', null, e.winner ? 'MENANG: ' + e.winner : 'SERI', ' · ', e.your_score, '-', e.opponent_score)),
        ),
      ),
  );
}
function Board({ me: a, refresh: t, logout: s }) {
  const n = { title: '', subject: '', deadline: '', priority: 1, notes: '' },
    [r, d] = useState([]),
    [o, p] = useState(n),
    [g, v] = useState(null),
    [l, c] = useState(''),
    [f, x] = useState(null),
    [h, y] = useState(''),
    [w, E] = useState('todo'),
    N = async () => {
      const e = await api('GET', '/tasks');
      (d(Array.isArray(e.data) ? e.data : []), t());
    };
  (useEffect(() => {
    N();
  }, []),
    useEffect(() => {
      a.new && a.new.length && (y('BADGE BARU: ' + a.new.map((e) => BADGES.find((m) => m.c === e).n).join(', ')), setTimeout(() => y(''), 4500));
    }, [a]));
  const D = async (e) => {
      if ((e.preventDefault(), !o.title.trim())) return;
      const { title: m, subject: u, deadline: i, priority: b, notes: I } = o,
        S = { title: m, subject: u, deadline: i, priority: b, notes: I };
      (g ? await api('PUT', '/tasks/' + g, S) : await api('POST', '/tasks', S), p(n), v(null), N());
    },
    A = async (e, m) => {
      const u = COLS[COLS.findIndex((i) => i.k === e.status) + m].k;
      (await api('PUT', '/tasks/' + e.id, u === 'done' ? { status: u, done_at: iso(0) } : { status: u }), N());
    },
    C = (e) => {
      (p({ ...n, ...e }), v(e.id), window.scrollTo({ top: 0, behavior: 'smooth' }));
    },
    O = async (e) => {
      if (f !== e.id) {
        x(e.id);
        return;
      }
      (await api('DELETE', '/tasks/' + e.id), x(null), N());
    },
    R = r.filter((e) => e.status === 'done').length,
    k = r.filter((e) => e.status === 'done').reduce((e, m) => e + m.priority * 10, 0),
    M = r.filter((e) => e.status !== 'done' && day(e.deadline) < 0).length,
    T = r.filter((e) => (e.title + e.subject).toLowerCase().includes(l.toLowerCase())),
    P = a.days || [];
  return React.createElement(
    'main',
    { className: 'max-w-6xl 2xl:max-w-7xl mx-auto p-3 sm:p-4 md:p-8' },
    React.createElement(
      'header',
      { className: 'flex flex-wrap items-start justify-between gap-3 mb-6' },
      React.createElement(
        'div',
        null,
        React.createElement('h1', { className: 'h logo text-xl sm:text-3xl md:text-4xl' }, 'STUDYTASK', React.createElement('span', { className: 'blink' }, '_')),
        React.createElement('p', { className: 'opacity-80' }, 'Quest board mahasiswa \u2014 selesaikan tugas, naik level.'),
      ),
      React.createElement(
        'div',
        { className: 'flex gap-2 flex-wrap' },
        React.createElement('a', { href: '/', className: 'btn' }, '\u2190 BERANDA'),
        React.createElement('button', { className: 'btn max-w-full truncate', onClick: s }, 'LOGOUT @', a.user.username),
      ),
    ),
    React.createElement(
      'section',
      { className: 'grid md:grid-cols-3 gap-4 sm:gap-6 mb-4 sm:mb-6' },
      React.createElement(
        'div',
        { className: 'px p-4 md:col-span-2' },
        React.createElement('div', { className: 'h text-xs mb-3' }, 'PLAYER \xB7 LV ', Math.floor(k / 50) + 1),
        React.createElement(
          'div',
          { className: 'flex gap-1 mb-1' },
          Array.from({ length: 10 }, (e, m) => React.createElement('div', { key: m, className: 'seg ' + (m < (k % 50) / 5 ? 'on' : '') })),
        ),
        React.createElement('div', { className: 'mb-4' }, k % 50, '/50 XP \xB7 ', R, ' quest selesai \xB7 ', M, ' telat'),
        React.createElement(
          'div',
          { className: 'flex items-center gap-3 mb-2' },
          React.createElement(Pix, { m: BADGES[4].m, z: 25, col: 'var(--hot)' }),
          React.createElement('span', { className: 'h text-xs' }, 'STREAK ', a.streak, ' HARI'),
          React.createElement('span', { className: 'opacity-60' }, '(terbaik: ', a.best, ')'),
        ),
        React.createElement(
          'div',
          { className: 'flex gap-1' },
          Array.from({ length: 7 }, (e, m) => {
            const u = iso(m - 6);
            return React.createElement('div', { key: u, title: u, className: 'seg ' + (P.includes(u) ? 'on hot' : '') });
          }),
        ),
        React.createElement('div', { className: 'flex justify-between opacity-60 text-base' }, React.createElement('span', null, '6 hari lalu'), React.createElement('span', null, 'hari ini')),
      ),
      React.createElement(Pomo, null),
    ),
    React.createElement(
      'section',
      { className: 'px p-4 mb-6' },
      React.createElement('div', { className: 'h text-xs mb-4' }, 'ACHIEVEMENTS ', a.earned.length, '/', BADGES.length),
      React.createElement(
        'div',
        { className: 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4' },
        BADGES.map((e) =>
          React.createElement(
            'div',
            { key: e.c, className: 'text-center', style: a.earned.includes(e.c) ? {} : { opacity: 0.35, filter: 'grayscale(1)' } },
            React.createElement(Pix, { m: e.m, col: BCOL[e.c] }),
            React.createElement('div', { className: 'h text-[8px] mt-2' }, e.n),
            React.createElement('div', { className: 'text-base leading-4 mt-1' }, e.d),
          ),
        ),
      ),
    ),
    React.createElement(Friends, null),
    React.createElement(BattleArena, null),
    React.createElement(
      'form',
      { onSubmit: D, className: 'px p-4 grid md:grid-cols-6 gap-3 mb-6' },
      React.createElement('div', { className: 'h text-xs md:col-span-6' }, g ? '> EDIT QUEST' : '> QUEST BARU'),
      React.createElement('input', { className: 'md:col-span-3', placeholder: 'Judul tugas *', value: o.title, onChange: (e) => p({ ...o, title: e.target.value }) }),
      React.createElement('input', { className: 'md:col-span-3', placeholder: 'Mata kuliah', value: o.subject, onChange: (e) => p({ ...o, subject: e.target.value }) }),
      React.createElement('input', { className: 'md:col-span-2', type: 'date', value: o.deadline || '', onChange: (e) => p({ ...o, deadline: e.target.value }) }),
      React.createElement(
        'select',
        { className: 'md:col-span-1', value: o.priority, onChange: (e) => p({ ...o, priority: +e.target.value }) },
        [1, 2, 3].map((e) => React.createElement('option', { key: e, value: e }, PRI[e])),
      ),
      React.createElement('input', { className: 'md:col-span-3', placeholder: 'Catatan (opsional)', value: o.notes || '', onChange: (e) => p({ ...o, notes: e.target.value }) }),
      React.createElement(
        'div',
        { className: 'md:col-span-6 flex gap-3' },
        React.createElement('button', { className: 'btn pri flex-1 sm:flex-none' }, g ? 'UPDATE' : '+ TAMBAH'),
        g &&
          React.createElement(
            'button',
            {
              type: 'button',
              className: 'btn',
              onClick: () => {
                (p(n), v(null));
              },
            },
            'BATAL',
          ),
      ),
    ),
    React.createElement('input', { className: 'mb-6', placeholder: 'cari judul / mata kuliah...', value: l, onChange: (e) => c(e.target.value) }),
    React.createElement(
      'div',
      { className: 'flex gap-2 mb-4 lg:hidden' },
      COLS.map((e) =>
        React.createElement(
          'button',
          { key: e.k, className: 'btn flex-1 px-1', onClick: () => E(e.k), style: w === e.k ? { background: CCOL[e.k], color: 'var(--ink)', borderColor: CCOL[e.k] } : {} },
          e.n,
          ' (',
          T.filter((m) => m.status === e.k).length,
          ')',
        ),
      ),
    ),
    React.createElement(
      'section',
      { className: 'grid lg:grid-cols-3 gap-6' },
      COLS.map((e, m) => {
        const u = T.filter((i) => i.status === e.k).sort((i, b) => ((i.deadline || '9') > (b.deadline || '9') ? 1 : -1));
        return React.createElement(
          'div',
          { key: e.k, className: (w === e.k ? 'block' : 'hidden') + ' lg:block min-w-0' },
          React.createElement('div', { className: 'px p-2 h text-xs mb-4 hidden lg:block', style: { borderColor: CCOL[e.k], color: CCOL[e.k] } }, e.n, ' (', u.length, ')'),
          !u.length && React.createElement('div', { className: 'opacity-50 text-center' }, '-- kosong --'),
          React.createElement(
            'div',
            { className: 'grid md:grid-cols-2 lg:grid-cols-1 gap-4 items-start' },
            u.map((i) => {
              const b = i.status !== 'done' && day(i.deadline) !== null && day(i.deadline) <= 1;
              return React.createElement(
                'div',
                { key: i.id, className: 'card p-3 min-w-0', style: { borderTop: '10px solid ' + CCOL[e.k] } },
                React.createElement(
                  'div',
                  { className: 'flex justify-between gap-2' },
                  React.createElement('span', { className: 'tag truncate' }, i.subject || 'UMUM'),
                  React.createElement('span', { style: { color: PCOL[i.priority] }, title: PRI[i.priority] }, '\u25A0'.repeat(i.priority) + '\u25A1'.repeat(3 - i.priority)),
                ),
                React.createElement('div', { className: 'h text-[11px] my-2 break-words' }, i.title),
                i.notes && React.createElement('div', { className: 'leading-5 mb-1 break-words' }, i.notes),
                React.createElement('div', { className: b ? 'blink font-bold late' : '' }, 'DEADLINE: ', lbl(i.deadline)),
                React.createElement(
                  'div',
                  { className: 'flex gap-1 mt-2 flex-wrap' },
                  m > 0 && React.createElement('button', { className: 'btn', onClick: () => A(i, -1) }, '\u25C0'),
                  m < 2 && React.createElement('button', { className: 'btn', onClick: () => A(i, 1) }, '\u25B6'),
                  React.createElement('button', { className: 'btn', onClick: () => C(i) }, 'EDIT'),
                  React.createElement('button', { className: 'btn', onClick: () => O(i) }, f === i.id ? 'YAKIN?' : 'DEL'),
                ),
              );
            }),
          ),
        );
      }),
    ),
    React.createElement('footer', { className: 'h text-[10px] text-center mt-10 opacity-60' }, '\xA9 STUDYTASK \xB7 MADE FOR MAHASISWA'),
    h && React.createElement('div', { className: 'toast h text-[10px] p-3 fixed bottom-3 left-3 right-3 sm:left-auto z-10 sm:max-w-xs' }, '\u2605 ', h),
  );
}
function App() {
  const [a, t] = useState(null),
    [s, n] = useState(!1),
    r = async () => {
      const o = await api('GET', '/me?today=' + iso(0));
      (n(!!window.__off), t(o.ok ? o.data : !1));
    };
  useEffect(() => {
    r();
  }, []);
  const d = async () => {
    (await api('POST', '/logout'), t(!1));
  };
  return React.createElement(
    React.Fragment,
    null,
    s && React.createElement('div', { className: 'demo h text-[9px] text-center py-1 px-2' }, 'DEMO MODE \u2014 backend tidak terhubung, data hanya contoh'),
    a && a.user ? React.createElement(Board, { me: a, refresh: r, logout: d }) : React.createElement(Auth, { done: r, off: s }),
  );
}
ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(App, null));
