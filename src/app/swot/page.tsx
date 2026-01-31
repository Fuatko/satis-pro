'use client';

import Header from '@/components/Header';
import { Card, CardHeader, CardTitle, CardBody, Button, Badge, Modal, Input, Select, Textarea, EmptyState } from '@/components/ui';
import { formatDate } from '@/lib/utils';
import { Compass, Plus, Edit2, Trash2, RefreshCw, User } from 'lucide-react';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';

interface SwotAnalysis {
  id: string;
  sales_person_id: string;
  category: 'strength' | 'weakness' | 'opportunity' | 'threat';
  content: string;
  priority: number;
  created_at: string;
}

const categoryConfig = {
  strength: { label: 'Güçlü Yönler', color: 'bg-green-100 text-green-700 border-green-300', icon: '💪', bgCard: 'bg-green-50' },
  weakness: { label: 'Zayıf Yönler', color: 'bg-red-100 text-red-700 border-red-300', icon: '⚠️', bgCard: 'bg-red-50' },
  opportunity: { label: 'Fırsatlar', color: 'bg-blue-100 text-blue-700 border-blue-300', icon: '🎯', bgCard: 'bg-blue-50' },
  threat: { label: 'Tehditler', color: 'bg-amber-100 text-amber-700 border-amber-300', icon: '🔥', bgCard: 'bg-amber-50' },
};

export default function SwotPage() {
  const [analyses, setAnalyses] = useState<SwotAnalysis[]>([]);
  const [salesTeam, setSalesTeam] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SwotAnalysis | null>(null);
  const [selectedPerson, setSelectedPerson] = useState<string>('');
  const [formData, setFormData] = useState({
    sales_person_id: '',
    category: 'strength' as 'strength' | 'weakness' | 'opportunity' | 'threat',
    content: '',
    priority: 1,
  });

  const supabase = createClient();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [swotRes, teamRes] = await Promise.all([
        supabase.from('swot_analyses').select('*').order('priority', { ascending: false }),
        supabase.from('sales_team').select('id, name, avatar').eq('status', 'active'),
      ]);
      setAnalyses(swotRes.data || []);
      setSalesTeam(teamRes.data || []);
      if (teamRes.data && teamRes.data.length > 0 && !selectedPerson) {
        setSelectedPerson(teamRes.data[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const openModal = (item?: SwotAnalysis, category?: string) => {
    if (item) {
      setEditing(item);
      setFormData({
        sales_person_id: item.sales_person_id,
        category: item.category,
        content: item.content,
        priority: item.priority,
      });
    } else {
      setEditing(null);
      setFormData({
        sales_person_id: selectedPerson,
        category: (category as any) || 'strength',
        content: '',
        priority: 1,
      });
    }
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.content || !formData.sales_person_id) {
      alert('Kişi ve içerik zorunludur');
      return;
    }
    try {
      if (editing) {
        await supabase.from('swot_analyses').update(formData).eq('id', editing.id);
      } else {
        await supabase.from('swot_analyses').insert([formData]);
      }
      setModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert('Hata: ' + err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Silmek istediğinize emin misiniz?')) return;
    await supabase.from('swot_analyses').delete().eq('id', id);
    fetchData();
  };

  const getSalesPerson = (id: string) => salesTeam.find(s => s.id === id);
  
  // Seçili kişinin analizleri
  const personAnalyses = analyses.filter(a => a.sales_person_id === selectedPerson);
  const getByCategory = (cat: string) => personAnalyses.filter(a => a.category === cat);

  if (loading) {
    return <div><Header title="SWOT Analizi" /><div className="flex h-96 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" /></div></div>;
  }

  const selectedPersonData = getSalesPerson(selectedPerson);

  return (
    <div>
      <Header title="SWOT Analizi" />
      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Select
              value={selectedPerson}
              onChange={(e) => setSelectedPerson(e.target.value)}
              options={salesTeam.map(s => ({ value: s.id, label: `${s.avatar} ${s.name}` }))}
              className="w-64"
            />
            <p className="text-sm text-slate-500">{personAnalyses.length} analiz</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={fetchData}><RefreshCw className="h-4 w-4" /></Button>
            <Button onClick={() => openModal()}><Plus className="h-4 w-4" />Yeni Ekle</Button>
          </div>
        </div>

        {/* Kişi Başlığı */}
        {selectedPersonData && (
          <Card className="mb-6 bg-gradient-to-r from-slate-100 to-slate-50">
            <CardBody className="flex items-center gap-4">
              <span className="text-5xl">{selectedPersonData.avatar}</span>
              <div>
                <h2 className="text-2xl font-bold">{selectedPersonData.name}</h2>
                <p className="text-slate-500">Kişisel SWOT Analizi</p>
              </div>
              <div className="ml-auto flex gap-2">
                <Badge>💪 {getByCategory('strength').length}</Badge>
                <Badge>⚠️ {getByCategory('weakness').length}</Badge>
                <Badge>🎯 {getByCategory('opportunity').length}</Badge>
                <Badge>🔥 {getByCategory('threat').length}</Badge>
              </div>
            </CardBody>
          </Card>
        )}

        {/* SWOT Grid */}
        <div className="grid grid-cols-2 gap-4">
          {(['strength', 'weakness', 'opportunity', 'threat'] as const).map(category => {
            const config = categoryConfig[category];
            const items = getByCategory(category);
            
            return (
              <Card key={category} className={`${config.bgCard} border-2`}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">
                      <span className="mr-2">{config.icon}</span>
                      {config.label}
                      <Badge className="ml-2">{items.length}</Badge>
                    </CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => openModal(undefined, category)}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardBody className="pt-0">
                  {items.length > 0 ? (
                    <div className="space-y-2">
                      {items.map(item => (
                        <div key={item.id} className="bg-white rounded-lg p-3 shadow-sm">
                          <div className="flex justify-between items-start gap-2">
                            <p className="text-sm flex-1">{item.content}</p>
                            <div className="flex gap-1 shrink-0">
                              <Button variant="ghost" size="sm" onClick={() => openModal(item)}>
                                <Edit2 className="h-3 w-3" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)}>
                                <Trash2 className="h-3 w-3 text-red-500" />
                              </Button>
                            </div>
                          </div>
                          <div className="mt-2 flex items-center gap-2">
                            <Badge variant={item.priority >= 3 ? 'danger' : item.priority >= 2 ? 'warning' : 'default'} className="text-xs">
                              Öncelik: {item.priority}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-slate-400 py-4 text-sm">
                      Henüz {config.label.toLowerCase()} eklenmemiş
                    </p>
                  )}
                </CardBody>
              </Card>
            );
          })}
        </div>

        {/* Tüm Ekip Özeti */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle><User className="h-4 w-4" /> Tüm Ekip SWOT Özeti</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-5 gap-4">
              <div className="font-semibold text-sm text-slate-600">Kişi</div>
              <div className="font-semibold text-sm text-center text-green-600">💪</div>
              <div className="font-semibold text-sm text-center text-red-600">⚠️</div>
              <div className="font-semibold text-sm text-center text-blue-600">🎯</div>
              <div className="font-semibold text-sm text-center text-amber-600">🔥</div>
              
              {salesTeam.map(person => {
                const pAnalyses = analyses.filter(a => a.sales_person_id === person.id);
                return (
                  <React.Fragment key={person.id}>
                    <div 
                      className={`flex items-center gap-2 cursor-pointer hover:bg-slate-100 rounded p-1 ${selectedPerson === person.id ? 'bg-blue-50' : ''}`}
                      onClick={() => setSelectedPerson(person.id)}
                    >
                      <span>{person.avatar}</span>
                      <span className="text-sm truncate">{person.name}</span>
                    </div>
                    <div className="text-center">{pAnalyses.filter(a => a.category === 'strength').length}</div>
                    <div className="text-center">{pAnalyses.filter(a => a.category === 'weakness').length}</div>
                    <div className="text-center">{pAnalyses.filter(a => a.category === 'opportunity').length}</div>
                    <div className="text-center">{pAnalyses.filter(a => a.category === 'threat').length}</div>
                  </React.Fragment>
                );
              })}
            </div>
          </CardBody>
        </Card>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Analiz Düzenle' : 'Yeni SWOT Analizi'}
        footer={<><Button variant="secondary" onClick={() => setModalOpen(false)}>İptal</Button><Button onClick={handleSave}>Kaydet</Button></>}>
        <div className="space-y-4">
          <Select
            label="Satış Temsilcisi"
            value={formData.sales_person_id}
            onChange={(e) => setFormData({ ...formData, sales_person_id: e.target.value })}
            options={salesTeam.map(s => ({ value: s.id, label: `${s.avatar} ${s.name}` }))}
          />
          <Select
            label="Kategori"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
            options={[
              { value: 'strength', label: '💪 Güçlü Yönler' },
              { value: 'weakness', label: '⚠️ Zayıf Yönler' },
              { value: 'opportunity', label: '🎯 Fırsatlar' },
              { value: 'threat', label: '🔥 Tehditler' },
            ]}
          />
          <Textarea
            label="İçerik"
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            rows={3}
            placeholder="Analiz açıklamasını yazın..."
          />
          <Select
            label="Öncelik"
            value={String(formData.priority)}
            onChange={(e) => setFormData({ ...formData, priority: Number(e.target.value) })}
            options={[
              { value: '1', label: '1 - Düşük' },
              { value: '2', label: '2 - Orta' },
              { value: '3', label: '3 - Yüksek' },
            ]}
          />
        </div>
      </Modal>
    </div>
  );
}

import React from 'react';
