import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, BarChart3, Plus, Trash2, LogOut, Download, AlertCircle, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://wqsrhakdozxubgwjfzov.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indxc3JoYWtkb3p4dWJnd2pmem92Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExNjc3ODUsImV4cCI6MjA3Njc0Mzc4NX0.Wgl3mhDvamJPA69x0fDHC1lp5vVv8tI0AiLvQV1cvQU'
);

const App = () => {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [entries, setEntries] = useState([]);
  const [tab, setTab] = useState('myHours');
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersRes, projectsRes, entriesRes] = await Promise.all([
        supabase.from('users').select('*'),
        supabase.from('projects').select('*'),
        supabase.from('entries').select('*')
      ]);
      if (usersRes.data) setUsers(usersRes.data);
      if (projectsRes.data) setProjects(projectsRes.data);
      if (entriesRes.data) setEntries(entriesRes.data);
    } catch (err) {
      console.error('Error loading:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><Clock className="w-12 h-12 text-indigo-600 animate-spin" /></div>;
  if (!user) return <Login setUser={setUser} users={users} loadData={loadData} />;
  return <Main user={user} setUser={setUser} users={users} projects={projects} entries={entries} tab={tab} setTab={setTab} loadData={loadData} />;
};

const Login = ({ setUser, users, loadData }) => {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [reg, setReg] = useState(false);
  const [name, setName] = useState('');
  const [err, setErr] = useState('');

  const auth = async () => {
    setErr('');
    if (reg) {
      if (!email.endsWith('@lxgcapital.com')) return setErr('Solo @lxgcapital.com');
      if (pass.length < 6) return setErr('Contraseña mínimo 6 caracteres');
      if (!name.trim()) return setErr('Ingresa tu nombre');
      if (users.find(u => u.email === email)) return setErr('Email ya registrado');
      
      const newUser = { 
        email, 
        name: name.trim(), 
        password: pass, 
        is_admin: email === 'jose.correa@lxgcapital.com' 
      };
      
      const { error } = await supabase.from('users').insert([newUser]);
      if (error) return setErr('Error al crear usuario');
      
      await loadData();
      setUser(newUser);
    } else {
      const foundUser = users.find(u => u.email === email && u.password === pass);
      if (!foundUser) return setErr('Email o contraseña incorrectos');
      setUser(foundUser);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="flex items-center justify-center mb-6">
          <div className="bg-indigo-600 p-3 rounded-xl mr-3"><Clock className="w-8 h-8 text-white" /></div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Time Tracker LXG</h1>
        </div>
        <div className="flex mb-6 bg-gray-100 rounded-xl p-1">
          <button onClick={() => setReg(false)} className={`flex-1 py-2 rounded-lg font-medium ${!reg ? 'bg-white shadow text-indigo-600' : 'text-gray-600'}`}>Login</button>
          <button onClick={() => setReg(true)} className={`flex-1 py-2 rounded-lg font-medium ${reg ? 'bg-white shadow text-indigo-600' : 'text-gray-600'}`}>Registro</button>
        </div>
        <div className="space-y-4">
          {reg && <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Nombre" className="w-full px-4 py-3 border-2 rounded-xl" />}
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@lxgcapital.com" className="w-full px-4 py-3 border-2 rounded-xl" />
          <input type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder="••••••••" className="w-full px-4 py-3 border-2 rounded-xl" onKeyPress={e => e.key === 'Enter' && auth()} />
          {err && <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{err}</div>}
          <button onClick={auth} className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl font-semibold">{reg ? 'Crear' : 'Entrar'}</button>
        </div>
      </div>
    </div>
  );
};

const Main = ({ user, setUser, users, projects, entries, tab, setTab, loadData }) => {
  const getWeek = () => { 
    const d = new Date(); 
    const start = new Date(d.getFullYear(), 0, 1); 
    const diff = d - start; 
    const oneWeek = 1000 * 60 * 60 * 24 * 7; 
    const weekNum = Math.ceil(diff / oneWeek); 
    return `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`; 
  };
  
  const [week, setWeek] = useState(getWeek());
  const [proj, setProj] = useState('');
  const [hrs, setHrs] = useState('');
  const [desc, setDesc] = useState('');
  const [newProj, setNewProj] = useState('');
  const [fProj, setFProj] = useState('all');
  const [fUser, setFUser] = useState('all');
  const [fStat, setFStat] = useState('all');
  const [startWeek, setStartWeek] = useState('');
  const [endWeek, setEndWeek] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);

  const weekHrs = (email, wk) => entries.filter(e => e.user_email === email && e.week === wk && e.status === 'approved').reduce((s, e) => s + parseFloat(e.hours), 0);
  const myHrs = weekHrs(user.email, week);

  const addEntry = async () => {
    if (!proj || !hrs || parseFloat(hrs) <= 0) return;
    const status = myHrs + parseFloat(hrs) > 70 ? 'pending' : 'approved';
    const project = projects.find(p => p.id === parseInt(proj));
    
    const newEntry = {
      user_email: user.email,
      user_name: user.name,
      project_id: parseInt(proj),
      project_name: project?.name,
      week,
      hours: parseFloat(hrs),
      description: desc.trim(),
      status
    };
    
    await supabase.from('entries').insert([newEntry]);
    await loadData();
    setProj(''); 
    setHrs(''); 
    setDesc('');
    if (status === 'pending') alert('Excede 70h, requiere aprobación');
  };

  const delEntry = async (id) => {
    const entry = entries.find(e => e.id === id);
    if (!entry) return;
    if (!user.is_admin && entry.user_email !== user.email) {
      alert('No tienes permisos');
      return;
    }
    setConfirmDelete(id);
  };

  const confirmDelEntry = async () => {
    await supabase.from('entries').delete().eq('id', confirmDelete);
    setConfirmDelete(null);
    await loadData();
  };

  const approve = async (id) => {
    await supabase.from('entries').update({ 
      status: 'approved', 
      approved_by: user.email, 
      approved_at: new Date().toISOString() 
    }).eq('id', id);
    await loadData();
  };

  const reject = async (id) => {
    await supabase.from('entries').update({ 
      status: 'rejected', 
      rejected_by: user.email, 
      rejected_at: new Date().toISOString() 
    }).eq('id', id);
    await loadData();
  };

  const addProj = async () => {
    if (!newProj.trim()) return;
    await supabase.from('projects').insert([{ name: newProj.trim(), created_by: user.email }]);
    await loadData();
    setNewProj('');
  };

  const delProj = async (id) => {
    if (!user.is_admin) return alert('Solo admins');
    setConfirmDelete(`proj-${id}`);
  };

  const confirmDelProj = async () => {
    const id = confirmDelete.replace('proj-', '');
    await supabase.from('projects').delete().eq('id', parseInt(id));
    setConfirmDelete(null);
    await loadData();
  };

  const myEntries = entries.filter(e => e.user_email === user.email).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  const filtered = entries.filter(e => 
    (fProj === 'all' || e.project_id === parseInt(fProj)) && 
    (fUser === 'all' || e.user_email === fUser) && 
    (fStat === 'all' || e.status === fStat)
  ).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  const pending = entries.filter(e => e.status === 'pending').sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const stats = {};
  entries.forEach(e => {
    if (e.status !== 'approved' || (startWeek && e.week < startWeek) || (endWeek && e.week > endWeek)) return;
    if (!stats[e.project_id]) stats[e.project_id] = { hrs: 0, users: {}, userDetails: {} };
    stats[e.project_id].hrs += parseFloat(e.hours);
    stats[e.project_id].users[e.user_email] = (stats[e.project_id].users[e.user_email] || 0) + parseFloat(e.hours);
    stats[e.project_id].userDetails[e.user_email] = e.user_name;
  });

  const total = { 
    hrs: entries.filter(e => e.status === 'approved').reduce((s, e) => s + parseFloat(e.hours), 0), 
    users: new Set(entries.filter(e => e.status === 'approved').map(e => e.user_email)).size, 
    pending: pending.length 
  };

  const exp = () => {
    const data = user.is_admin ? filtered : myEntries;
    const csv = [
      ['Semana', 'Usuario', 'Email', 'Proyecto', 'Horas', 'Desc', 'Estado'], 
      ...data.map(e => [
        e.week, 
        e.user_name, 
        e.user_email, 
        e.project_name || 'N/A', 
        e.hours, 
        e.description || '', 
        e.status === 'approved' ? 'Aprobado' : e.status === 'pending' ? 'Pendiente' : 'Rechazado'
      ])
    ].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `timesheet-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {confirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-sm mx-4">
            <h3 className="text-lg font-bold mb-2">Confirmar eliminación</h3>
            <p className="text-gray-600 mb-4">¿Estás seguro de eliminar este registro?</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">Cancelar</button>
              <button onClick={confirmDelete.startsWith('proj-') ? confirmDelProj : confirmDelEntry} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Eliminar</button>
            </div>
          </div>
        </div>
      )}

      <nav className="bg-white shadow sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-lg"><Clock className="w-6 h-6 text-white" /></div>
            <div><h1 className="font-bold text-gray-800">Time Tracker LXG</h1><p className="text-xs text-gray-500">LXG Capital</p></div>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={loadData} className="p-2 hover:bg-gray-100 rounded-lg" title="Recargar datos"><RefreshCw className="w-5 h-5" /></button>
            <div className="text-right hidden sm:block"><div className="font-semibold text-sm">{user.name}</div><div className="text-xs text-gray-500">{user.is_admin ? 'Admin' : 'Usuario'}</div></div>
            <button onClick={() => setUser(null)} className="p-2 hover:bg-gray-100 rounded-lg"><LogOut className="w-5 h-5" /></button>
          </div>
        </div>
      </nav>

      {user.is_admin && (
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-white bg-opacity-20 rounded-lg p-3"><div className="text-xs">Total Horas</div><div className="text-2xl font-bold">{total.hrs.toFixed(1)}</div></div>
              <div className="bg-white bg-opacity-20 rounded-lg p-3"><div className="text-xs">Usuarios</div><div className="text-2xl font-bold">{total.users}</div></div>
              <div className="bg-white bg-opacity-20 rounded-lg p-3"><div className="text-xs">Proyectos</div><div className="text-2xl font-bold">{projects.length}</div></div>
              <div className="bg-white bg-opacity-20 rounded-lg p-3"><div className="text-xs">Pendientes</div><div className="text-2xl font-bold">{total.pending}</div></div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <button onClick={() => setTab('myHours')} className={`px-4 py-2 rounded-lg whitespace-nowrap ${tab === 'myHours' ? 'bg-indigo-600 text-white' : 'bg-white'}`}><Calendar className="w-4 h-4 inline mr-1" />Mis Horas</button>
          {user.is_admin && (
            <>
              <button onClick={() => setTab('approvals')} className={`px-4 py-2 rounded-lg whitespace-nowrap relative ${tab === 'approvals' ? 'bg-indigo-600 text-white' : 'bg-white'}`}><AlertCircle className="w-4 h-4 inline mr-1" />Aprobar {total.pending > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{total.pending}</span>}</button>
              <button onClick={() => setTab('reports')} className={`px-4 py-2 rounded-lg whitespace-nowrap ${tab === 'reports' ? 'bg-indigo-600 text-white' : 'bg-white'}`}><BarChart3 className="w-4 h-4 inline mr-1" />Reportes</button>
              <button onClick={() => setTab('projects')} className={`px-4 py-2 rounded-lg whitespace-nowrap ${tab === 'projects' ? 'bg-indigo-600 text-white' : 'bg-white'}`}><Users className="w-4 h-4 inline mr-1" />Proyectos</button>
            </>
          )}
        </div>

        {tab === 'myHours' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-xl font-bold mb-4">Registrar Horas</h2>
              {projects.length === 0 && <div className="mb-4 p-4 bg-amber-50 border-2 border-amber-200 rounded-lg text-amber-800 text-sm">⚠️ No hay proyectos. {user.is_admin ? 'Ve a Proyectos.' : 'Contacta al admin.'}</div>}
              <div className="mb-4 p-3 bg-blue-50 rounded-lg flex justify-between items-center">
                <span className="text-sm">Horas aprobadas esta semana:</span>
                <span className={`font-bold text-lg ${myHrs > 70 ? 'text-red-600' : myHrs > 60 ? 'text-amber-600' : 'text-green-600'}`}>{myHrs.toFixed(1)}/70h</span>
              </div>
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div><label className="block text-sm font-semibold mb-1">Semana</label><input type="week" value={week} onChange={e => setWeek(e.target.value)} className="w-full px-4 py-2 border-2 rounded-lg" /></div>
                <div><label className="block text-sm font-semibold mb-1">Proyecto</label><select value={proj} onChange={e => setProj(e.target.value)} className="w-full px-4 py-2 border-2 rounded-lg"><option value="">Seleccionar...</option>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
                <div><label className="block text-sm font-semibold mb-1">Horas</label><input type="number" step="0.5" value={hrs} onChange={e => setHrs(e.target.value)} placeholder="8.0" className="w-full px-4 py-2 border-2 rounded-lg" /></div>
                <div><label className="block text-sm font-semibold mb-1">Descripción</label><input type="text" value={desc} onChange={e => setDesc(e.target.value)} placeholder="Opcional" className="w-full px-4 py-2 border-2 rounded-lg" /></div>
              </div>
              <button onClick={addEntry} disabled={!proj || !hrs} className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold disabled:opacity-50"><Plus className="w-4 h-4 inline mr-1" />Agregar</button>
            </div>

            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Mis Registros</h2>
                <button onClick={exp} className="px-4 py-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"><Download className="w-4 h-4 inline mr-1" />CSV</button>
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {myEntries.map(e => (
                  <div key={e.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="font-semibold">{e.project_name || 'Eliminado'}</div>
                      <div className="text-sm text-gray-600">{e.week} • {e.hours}h • {e.status === 'approved' ? '✓ Aprobado' : e.status === 'pending' ? '⏳ Pendiente' : '✗ Rechazado'}</div>
                      {e.description && <div className="text-sm text-gray-500">{e.description}</div>}
                    </div>
                    <button onClick={() => delEntry(e.id)} className="p-2 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
                {!myEntries.length && <div className="text-center py-12 text-gray-400">No hay registros</div>}
              </div>
            </div>
          </div>
        )}

        {tab === 'approvals' && user.is_admin && (
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-xl font-bold mb-4">Aprobaciones Pendientes</h2>
            <div className="space-y-3">
              {pending.map(e => (
                <div key={e.id} className="p-4 bg-amber-50 border-2 border-amber-200 rounded-lg">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="font-semibold">{e.user_name}</div>
                      <div className="text-sm text-gray-600">{e.project_name} • {e.week} • {e.hours}h</div>
                      {e.description && <div className="text-sm text-gray-500 mt-1">{e.description}</div>}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => approve(e.id)} className="p-2 bg-green-500 text-white rounded hover:bg-green-600"><CheckCircle className="w-5 h-5" /></button>
                      <button onClick={() => reject(e.id)} className="p-2 bg-red-500 text-white rounded hover:bg-red-600"><XCircle className="w-5 h-5" /></button>
                    </div>
                  </div>
                </div>
              ))}
              {!pending.length && <div className="text-center py-12 text-gray-400">No hay pendientes</div>}
            </div>
          </div>
        )}

        {tab === 'reports' && user.is_admin && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-xl font-bold mb-4">Estadísticas</h2>
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div><label className="block text-sm font-semibold mb-1">Desde</label><input type="week" value={startWeek} onChange={e => setStartWeek(e.target.value)} className="w-full px-4 py-2 border-2 rounded-lg" /></div>
                <div><label className="block text-sm font-semibold mb-1">Hasta</label><input type="week" value={endWeek} onChange={e => setEndWeek(e.target.value)} className="w-full px-4 py-2 border-2 rounded-lg" /></div>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(stats).map(([id, s]) => {
                  const project = projects.find(p => p.id === parseInt(id));
                  return (
                    <div key={id} className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg border-2 border-indigo-100">
                      <h3 className="font-bold mb-3 text-lg">{project?.name || 'Eliminado'}</h3>
                      <div className="text-sm space-y-2">
                        <div className="flex justify-between border-b pb-2">
                          <span className="font-semibold">Total:</span>
                          <span className="font-bold text-indigo-600">{s.hrs.toFixed(1)}h</span>
                        </div>
                        <div className="space-y-1">
                          <div className="font-semibold text-gray-700 mb-1">Por usuario:</div>
                          {Object.entries(s.users).map(([email, hrs]) => (
                            <div key={email} className="flex justify-between pl-2">
                              <span className="text-gray-600">{s.userDetails[email]}:</span>
                              <span className="font-semibold text-indigo-600">{hrs.toFixed(1)}h</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {!Object.keys(stats).length && <div className="col-span-full text-center py-12 text-gray-400">No hay datos</div>}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
                <h2 className="text-xl font-bold">Todos los Registros</h2>
                <div className="flex gap-2 flex-wrap">
                  <select value={fProj} onChange={e => setFProj(e.target.value)} className="px-3 py-2 border rounded-lg text-sm"><option value="all">Todos</option>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
                  <select value={fUser} onChange={e => setFUser(e.target.value)} className="px-3 py-2 border rounded-lg text-sm"><option value="all">Todos</option>{users.map(u => <option key={u.email} value={u.email}
