import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Trophy, 
  Image as ImageIcon, 
  Plus, 
  Trash2, 
  Save, 
  ChevronRight,
  Settings,
  Users,
  Activity,
  Calendar,
  Link,
  FileImage,
  Camera,
  CheckCircle
} from 'lucide-react';
import axios from 'axios';

// --- Configuration ---
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3005';

function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'challenges' | 'banners' | 'events' | 'registrations'>('dashboard');
  const [challenges, setChallenges] = useState<any[]>([]);
  const [banners, setBanners] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'challenges' || activeTab === 'dashboard') {
        const res = await axios.get(`${API_URL}/challenges`);
        setChallenges(res.data.challenges || []);
      }
      if (activeTab === 'banners' || activeTab === 'dashboard') {
        const res = await axios.get(`${API_URL}/banners`);
        setBanners(res.data.banners || []);
      }
      if (activeTab === 'events' || activeTab === 'dashboard') {
        const res = await axios.get(`${API_URL}/events`);
        setEvents(res.data.events || []);
      }
      if (activeTab === 'registrations' || activeTab === 'dashboard') {
        const res = await axios.get(`${API_URL}/admin/registrations`);
        setRegistrations(res.data.registrations || []);
      }
    } catch (e) {
      console.error('Fetch error:', e);
    }
    setLoading(false);
  };

  const handleAddChallenge = async () => {
    const name = prompt('Challenge Name:');
    if (!name) return;
    try {
      await axios.post(`${API_URL}/challenges`, { name, type: 'STEPS', goal: 10000 });
      fetchData();
    } catch (e) { alert('Save failed'); }
  };

  const handleAddBanner = async () => {
    const title = prompt('Banner Title:');
    if (!title) return;
    try {
      await axios.post(`${API_URL}/banners`, { title, subtitle: 'New Sponsor Offer' });
      fetchData();
    } catch (e) { alert('Save failed'); }
  };

  const handleAddEvent = async () => {
    const title = prompt('Event Title:');
    if (!title) return;
    const registrationUrl = prompt('Registration URL (optional):');
    const flyerTemplateUrl = prompt('Flyer Template URL (optional):');
    const status = confirm('Is this a Past Event?') ? 'past' : 'upcoming';
    const type = confirm('Is this an INTERNAL tracked event?') ? 'INTERNAL' : 'EXTERNAL';
    const photosUrl = status === 'past' ? prompt('Photos URL (optional):') : null;

    try {
      await axios.post(`${API_URL}/events`, { 
        title, 
        date: 'June 15, 2026', 
        subtitle: 'New Community Run',
        registrationUrl,
        flyerTemplateUrl,
        photosUrl,
        status,
        type,
        color: status === 'past' ? 'rgba(255,255,255,0.05)' : 'rgba(52, 199, 89, 0.15)'
      });
      fetchData();
    } catch (e) { alert('Save failed'); }
  };

  const handleApprove = async (userId: string, challengeId: string) => {
    try {
      await axios.post(`${API_URL}/admin/registrations/approve`, { userId, challengeId });
      fetchData();
    } catch (e) { alert('Approval failed'); }
  };

  const handleDelete = async (pk: string, sk: string) => {
    if (!confirm('Are you sure?')) return;
    try {
      let endpoint = '';
      if (pk === 'CHALLENGE') endpoint = 'challenges';
      else if (pk === 'BANNER') endpoint = 'banners';
      else if (pk === 'EVENT') endpoint = 'events';
      
      await axios.delete(`${API_URL}/${endpoint}?id=${sk}`);
      fetchData();
    } catch (e) { alert('Delete failed'); }
  };

  return (
    <div className="min-h-screen bg-[#0f0f13] text-white flex font-sans">
      {/* Sidebar */}
      <div className="w-64 bg-[#16161e] border-r border-white/5 flex flex-col">
        <div className="p-8">
          <h1 className="text-2xl font-black tracking-tighter text-[#ff7a00]">RunAstra</h1>
          <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold mt-1">Admin Panel</p>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          <NavItem 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')} 
            icon={<LayoutDashboard size={20} />} 
            label="Overview" 
          />
          <NavItem 
            active={activeTab === 'challenges'} 
            onClick={() => setActiveTab('challenges')} 
            icon={<Trophy size={20} />} 
            label="Challenges" 
          />
          <NavItem 
            active={activeTab === 'events'} 
            onClick={() => setActiveTab('events')} 
            icon={<Calendar size={20} />} 
            label="Events Hub" 
          />
          <NavItem 
            active={activeTab === 'registrations'} 
            onClick={() => setActiveTab('registrations')} 
            icon={<CheckCircle size={20} />} 
            label="Approvals" 
          />
          <NavItem 
            active={activeTab === 'banners'} 
            onClick={() => setActiveTab('banners')} 
            icon={<ImageIcon size={20} />} 
            label="Sponsor Banners" 
          />
          <div className="pt-8 opacity-20 px-4">
             <div className="h-px bg-white w-full mb-4" />
          </div>
          <NavItem active={false} icon={<Users size={20} />} label="Users" />
          <NavItem active={false} icon={<Settings size={20} />} label="Settings" />
        </nav>

        <div className="p-4 mt-auto">
          <div className="bg-[#1c1c28] p-4 rounded-xl border border-white/5 flex items-center gap-3">
             <div className="w-8 h-8 rounded-full bg-[#ff7a00] flex items-center justify-center font-bold text-xs">A</div>
             <div>
                <p className="text-sm font-bold">Admin</p>
                <p className="text-[10px] text-white/40">Solution Architect</p>
             </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-20 border-b border-white/5 flex items-center justify-between px-10 bg-[#0f0f13]/80 backdrop-blur-xl sticky top-0 z-10">
          <h2 className="text-xl font-bold capitalize">{activeTab}</h2>
          <div className="flex items-center gap-4">
            <div className="h-10 px-4 bg-white/5 rounded-full flex items-center gap-2 border border-white/5">
               <Activity size={16} className="text-[#ff7a00]" />
               <span className="text-xs font-medium text-white/60">System Online</span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-10">
          {activeTab === 'dashboard' && (
            <div className="space-y-10">
              <div className="grid grid-cols-4 gap-6">
                 <StatCard label="Challenges" value={challenges.length} color="text-blue-400" />
                 <StatCard label="Pending" value={registrations.length} color="text-yellow-400" />
                 <StatCard label="Banners" value={banners.length} color="text-[#ff7a00]" />
                 <StatCard label="Users" value="1,042" color="text-green-400" />
              </div>

              <section>
                 <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold">Recent Challenges</h3>
                    <button className="text-[#ff7a00] text-sm font-bold flex items-center gap-1 hover:underline">
                       View All <ChevronRight size={14} />
                    </button>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    {challenges.slice(0, 4).map((c, i) => (
                      <div key={i} className="bg-[#16161e] p-5 rounded-2xl border border-white/5 flex items-center justify-between">
                         <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-[#ff7a00]/10 rounded-xl flex items-center justify-center">
                               <Trophy className="text-[#ff7a00]" size={24} />
                            </div>
                            <div>
                               <p className="font-bold">{c.name}</p>
                               <p className="text-xs text-white/40">{c.type}</p>
                            </div>
                         </div>
                         <div className="text-right">
                            <p className="text-sm font-bold">{c.goal?.toLocaleString()} target</p>
                         </div>
                      </div>
                    ))}
                 </div>
              </section>
            </div>
          )}

          {activeTab === 'registrations' && (
            <div className="space-y-6">
               <h3 className="text-lg font-bold">Pending Approvals</h3>
               <div className="bg-[#16161e] rounded-2xl border border-white/5 overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-white/5 border-b border-white/5 text-[10px] uppercase tracking-widest font-black text-white/40">
                      <tr>
                        <th className="px-6 py-4">User</th>
                        <th className="px-6 py-4">Challenge ID</th>
                        <th className="px-6 py-4">Date Requested</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {registrations.map((reg, idx) => (
                        <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                          <td className="px-6 py-6 font-bold">{reg.userName || reg.userId}</td>
                          <td className="px-6 py-6 text-sm text-white/40">{reg.challengeId}</td>
                          <td className="px-6 py-6 text-sm text-white/40">{new Date(reg.requestedAt).toLocaleDateString()}</td>
                          <td className="px-6 py-6 text-right">
                             <button 
                                onClick={() => handleApprove(reg.userId, reg.challengeId)}
                                className="bg-green-500 hover:bg-green-600 text-black px-4 py-2 rounded-lg font-bold text-xs transition-transform active:scale-95"
                             >
                               Approve
                             </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {registrations.length === 0 && <div className="p-20 text-center text-white/20 font-bold uppercase tracking-widest text-xs">No pending requests</div>}
               </div>
            </div>
          )}

          {(activeTab === 'challenges' || activeTab === 'banners' || activeTab === 'events') && (
            <div className="space-y-6">
               <div className="flex justify-between items-center">
                  <p className="text-white/40 text-sm">Manage all platform {activeTab} content.</p>
                  <button 
                    onClick={
                        activeTab === 'challenges' ? handleAddChallenge : 
                        activeTab === 'banners' ? handleAddBanner : handleAddEvent
                    }
                    className="bg-[#ff7a00] hover:bg-[#ff8c20] text-black px-6 py-3 rounded-full font-black text-sm flex items-center gap-2 transition-transform active:scale-95"
                  >
                    <Plus size={18} /> Add {activeTab === 'challenges' ? 'Challenge' : activeTab === 'banners' ? 'Banner' : 'Event'}
                  </button>
               </div>

               <div className="bg-[#16161e] rounded-2xl border border-white/5 overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-white/5 border-b border-white/5 text-[10px] uppercase tracking-widest font-black text-white/40">
                      <tr>
                        <th className="px-6 py-4">Title / Name</th>
                        <th className="px-6 py-4">Type / Info</th>
                        <th className="px-6 py-4">Assets</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {(activeTab === 'challenges' ? challenges : activeTab === 'banners' ? banners : events).map((item, idx) => (
                        <tr key={idx} className="hover:bg-white/[0.02] transition-colors group">
                          <td className="px-6 py-6 font-bold">
                            {item.name || item.title}
                            {item.status === 'past' && <span className="ml-2 text-[8px] bg-white/10 px-1.5 py-0.5 rounded text-white/40">PAST</span>}
                          </td>
                          <td className="px-6 py-6 text-sm text-white/40">{item.type || item.date || item.subtitle}</td>
                          <td className="px-6 py-6">
                             <div className="flex gap-2">
                                {item.registrationUrl && <Link size={14} className="text-blue-400" />}
                                {item.flyerTemplateUrl && <FileImage size={14} className="text-[#ff7a00]" />}
                                {item.photosUrl && <Camera size={14} className="text-green-400" />}
                             </div>
                          </td>
                          <td className="px-6 py-6">
                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                               <button className="p-2 hover:bg-white/5 rounded-lg transition-colors"><Save size={16} className="text-white/40" /></button>
                               <button 
                                onClick={() => handleDelete(item.PK, item.SK)}
                                className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                               >
                                <Trash2 size={16} className="text-red-400" />
                               </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {loading && <div className="p-10 text-center text-white/20 font-bold uppercase tracking-widest text-xs">Loading...</div>}
                  {!loading && (activeTab === 'challenges' ? challenges : activeTab === 'banners' ? banners : events).length === 0 && (
                    <div className="p-20 text-center flex flex-col items-center gap-4">
                       <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center">
                          {activeTab === 'challenges' ? <Trophy size={32} className="text-white/20" /> : activeTab === 'events' ? <Calendar size={32} className="text-white/20" /> : <ImageIcon size={32} className="text-white/20" />}
                       </div>
                       <p className="text-white/40 font-bold">No {activeTab} found</p>
                    </div>
                  )}
               </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function NavItem({ active, icon, label, onClick }: { active: boolean, icon: React.ReactNode, label: string, onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${
        active ? 'bg-[#ff7a00] text-black shadow-lg shadow-[#ff7a00]/20' : 'text-white/40 hover:text-white hover:bg-white/5'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function StatCard({ label, value, color }: { label: string, value: string | number, color: string }) {
  return (
    <div className="bg-[#16161e] p-6 rounded-2xl border border-white/5 shadow-xl">
      <p className="text-[10px] uppercase font-black tracking-widest text-white/30 mb-2">{label}</p>
      <p className={`text-4xl font-black ${color}`}>{value}</p>
    </div>
  );
}

export default App;
