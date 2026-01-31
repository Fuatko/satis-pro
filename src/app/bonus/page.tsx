'use client';

import Header from '@/components/Header';
import { Card, CardHeader, CardTitle, CardBody, Button, Badge, Modal, Input, ProgressBar } from '@/components/ui';
import { formatMoney } from '@/lib/utils';
import { Award, RefreshCw, Edit2, Save, TrendingUp } from 'lucide-react';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';

interface BonusTier {
  id: string;
  min_rate: number;
  max_rate: number;
  bonus_rate: number;
}

interface FixedBonus {
  id: string;
  bonus_key: string;
  bonus_name: string;
  amount: number;
}

export default function BonusPage() {
  const [salesTiers, setSalesTiers] = useState<BonusTier[]>([]);
  const [collectionTiers, setCollectionTiers] = useState<BonusTier[]>([]);
  const [fixedBonuses, setFixedBonuses] = useState<FixedBonus[]>([]);
  const [targets, setTargets] = useState<any[]>([]);
  const [salesTeam, setSalesTeam] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTiers, setEditingTiers] = useState(false);
  const [editingFixed, setEditingFixed] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState(new Date().toISOString().slice(0, 7));

  const supabase = createClient();

  const defaultSalesTiers = [
    { min_rate: 0, max_rate: 80, bonus_rate: 0 },
    { min_rate: 80, max_rate: 100, bonus_rate: 3 },
    { min_rate: 100, max_rate: 110, bonus_rate: 5 },
    { min_rate: 110, max_rate: 120, bonus_rate: 7 },
    { min_rate: 120, max_rate: 999, bonus_rate: 10 },
  ];

  const defaultCollectionTiers = [
    { min_rate: 0, max_rate: 80, bonus_rate: 0 },
    { min_rate: 80, max_rate: 100, bonus_rate: 2 },
    { min_rate: 100, max_rate: 110, bonus_rate: 3.5 },
    { min_rate: 110, max_rate: 120, bonus_rate: 5 },
    { min_rate: 120, max_rate: 999, bonus_rate: 7 },
  ];

  const defaultFixedBonuses = [
    { bonus_key: 'new_customer', bonus_name: 'Yeni Müşteri Primi', amount: 500 },
    { bonus_key: 'perfect_collection', bonus_name: 'Tam Tahsilat Primi', amount: 2000 },
    { bonus_key: 'quarterly_champion', bonus_name: 'Çeyrek Şampiyonu', amount: 5000 },
    { bonus_key: 'yearly_champion', bonus_name: 'Yıl Şampiyonu', amount: 25000 },
    { bonus_key: 'team_target', bonus_name: 'Takım Hedefi Primi', amount: 3000 },
  ];

  const fetchData = async () => {
    setLoading(true);
    try {
      const [salesTiersRes, collTiersRes, fixedRes, targetRes, teamRes] = await Promise.all([
        supabase.from('bonus_tiers_sales').select('*').order('min_rate'),
        supabase.from('bonus_tiers_collection').select('*').order('min_rate'),
        supabase.from('fixed_bonuses').select('*'),
        supabase.from('targets').select('*').eq('period', selectedPeriod),
        supabase.from('sales_team').select('id, name, avatar').eq('status', 'active'),
      ]);

      // Eğer tier yoksa default ekle
      if (!salesTiersRes.data || salesTiersRes.data.length === 0) {
        await supabase.from('bonus_tiers_sales').insert(defaultSalesTiers);
        setSalesTiers(defaultSalesTiers.map((t, i) => ({ ...t, id: String(i) })));
      } else {
        setSalesTiers(salesTiersRes.data);
      }

      if (!collTiersRes.data || collTiersRes.data.length === 0) {
        await supabase.from('bonus_tiers_collection').insert(defaultCollectionTiers);
        setCollectionTiers(defaultCollectionTiers.map((t, i) => ({ ...t, id: String(i) })));
      } else {
        setCollectionTiers(collTiersRes.data);
      }

      if (!fixedRes.data || fixedRes.data.length === 0) {
        await supabase.from('fixed_bonuses').insert(defaultFixedBonuses);
        setFixedBonuses(defaultFixedBonuses.map((f, i) => ({ ...f, id: String(i) })));
      } else {
        setFixedBonuses(fixedRes.data);
      }

      setTargets(targetRes.data || []);
      setSalesTeam(teamRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [selectedPeriod]);

  const calculateBonus = (achieved: number, target: number, tiers: BonusTier[]) => {
    if (target <= 0) return 0;
    const rate = (achieved / target) * 100;
    const tier = tiers.find(t => rate >= t.min_rate && rate < t.max_rate);
    return tier ? (achieved * tier.bonus_rate / 100) : 0;
  };

  const saveTiers = async () => {
    try {
      // Önce tümünü sil, sonra yeniden ekle
      await supabase.from('bonus_tiers_sales').delete().neq('id', '');
      await supabase.from('bonus_tiers_collection').delete().neq('id', '');
      await supabase.from('bonus_tiers_sales').insert(salesTiers.map(({ id, ...rest }) => rest));
      await supabase.from('bonus_tiers_collection').insert(collectionTiers.map(({ id, ...rest }) => rest));
      setEditingTiers(false);
      fetchData();
    } catch (err: any) {
      alert('Hata: ' + err.message);
    }
  };

  const saveFixedBonuses = async () => {
    try {
      for (const bonus of fixedBonuses) {
        await supabase.from('fixed_bonuses').update({ amount: bonus.amount }).eq('id', bonus.id);
      }
      setEditingFixed(false);
    } catch (err: any) {
      alert('Hata: ' + err.message);
    }
  };

  const getSalesPerson = (id: string) => salesTeam.find(s => s.id === id);

  if (loading) {
    return <div><Header title="Prim Yönetimi" /><div className="flex h-96 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" /></div></div>;
  }

  return (
    <div>
      <Header title="Prim Yönetimi" />
      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Input type="month" value={selectedPeriod} onChange={(e) => setSelectedPeriod(e.target.value)} className="w-40" />
          </div>
          <Button variant="secondary" onClick={fetchData}><RefreshCw className="h-4 w-4" /></Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Satış Prim Kademeleri */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle><TrendingUp className="h-4 w-4" /> Satış Prim Kademeleri</CardTitle>
                {editingTiers ? (
                  <Button size="sm" onClick={saveTiers}><Save className="h-4 w-4" /> Kaydet</Button>
                ) : (
                  <Button variant="ghost" size="sm" onClick={() => setEditingTiers(true)}><Edit2 className="h-4 w-4" /></Button>
                )}
              </div>
            </CardHeader>
            <CardBody>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Başarı Oranı</th>
                    <th className="text-right p-2">Prim %</th>
                  </tr>
                </thead>
                <tbody>
                  {salesTiers.map((tier, idx) => (
                    <tr key={idx} className="border-b">
                      <td className="p-2">%{tier.min_rate} - %{tier.max_rate === 999 ? '∞' : tier.max_rate}</td>
                      <td className="p-2 text-right">
                        {editingTiers ? (
                          <Input type="number" value={tier.bonus_rate} className="w-20 text-right"
                            onChange={(e) => {
                              const newTiers = [...salesTiers];
                              newTiers[idx].bonus_rate = Number(e.target.value);
                              setSalesTiers(newTiers);
                            }} />
                        ) : (
                          <Badge variant={tier.bonus_rate > 5 ? 'success' : tier.bonus_rate > 0 ? 'warning' : 'default'}>
                            %{tier.bonus_rate}
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardBody>
          </Card>

          {/* Tahsilat Prim Kademeleri */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle><TrendingUp className="h-4 w-4" /> Tahsilat Prim Kademeleri</CardTitle>
              </div>
            </CardHeader>
            <CardBody>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Başarı Oranı</th>
                    <th className="text-right p-2">Prim %</th>
                  </tr>
                </thead>
                <tbody>
                  {collectionTiers.map((tier, idx) => (
                    <tr key={idx} className="border-b">
                      <td className="p-2">%{tier.min_rate} - %{tier.max_rate === 999 ? '∞' : tier.max_rate}</td>
                      <td className="p-2 text-right">
                        {editingTiers ? (
                          <Input type="number" value={tier.bonus_rate} className="w-20 text-right"
                            onChange={(e) => {
                              const newTiers = [...collectionTiers];
                              newTiers[idx].bonus_rate = Number(e.target.value);
                              setCollectionTiers(newTiers);
                            }} />
                        ) : (
                          <Badge variant={tier.bonus_rate > 3 ? 'success' : tier.bonus_rate > 0 ? 'warning' : 'default'}>
                            %{tier.bonus_rate}
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardBody>
          </Card>

          {/* Sabit Primler */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle><Award className="h-4 w-4" /> Sabit Primler</CardTitle>
                {editingFixed ? (
                  <Button size="sm" onClick={saveFixedBonuses}><Save className="h-4 w-4" /> Kaydet</Button>
                ) : (
                  <Button variant="ghost" size="sm" onClick={() => setEditingFixed(true)}><Edit2 className="h-4 w-4" /></Button>
                )}
              </div>
            </CardHeader>
            <CardBody>
              <div className="space-y-3">
                {fixedBonuses.map((bonus, idx) => (
                  <div key={bonus.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                    <span className="text-sm">{bonus.bonus_name}</span>
                    {editingFixed ? (
                      <Input type="number" value={bonus.amount} className="w-28 text-right"
                        onChange={(e) => {
                          const newBonuses = [...fixedBonuses];
                          newBonuses[idx].amount = Number(e.target.value);
                          setFixedBonuses(newBonuses);
                        }} />
                    ) : (
                      <span className="font-bold text-green-600">₺{formatMoney(bonus.amount)}</span>
                    )}
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          {/* Prim Hesaplama Özeti */}
          <Card>
            <CardHeader>
              <CardTitle><Award className="h-4 w-4" /> {selectedPeriod} Prim Özeti</CardTitle>
            </CardHeader>
            <CardBody>
              {targets.length > 0 ? (
                <div className="space-y-4">
                  {targets.map(t => {
                    const person = getSalesPerson(t.sales_person_id);
                    const salesBonus = calculateBonus(t.achieved_sales, t.sales_target, salesTiers);
                    const collBonus = calculateBonus(t.achieved_collection, t.collection_target, collectionTiers);
                    const totalBonus = salesBonus + collBonus;
                    const salesRate = t.sales_target > 0 ? Math.round(t.achieved_sales / t.sales_target * 100) : 0;
                    const collRate = t.collection_target > 0 ? Math.round(t.achieved_collection / t.collection_target * 100) : 0;

                    return (
                      <div key={t.id} className="p-3 bg-slate-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{person?.avatar || '👤'}</span>
                            <span className="font-medium">{person?.name || 'Bilinmiyor'}</span>
                          </div>
                          <span className="text-lg font-bold text-green-600">₺{formatMoney(totalBonus)}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-slate-500">Satış: %{salesRate}</span>
                            <span className="float-right text-blue-600">₺{formatMoney(salesBonus)}</span>
                          </div>
                          <div>
                            <span className="text-slate-500">Tahsilat: %{collRate}</span>
                            <span className="float-right text-orange-600">₺{formatMoney(collBonus)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">Toplam Prim</span>
                      <span className="text-xl font-bold text-green-600">
                        ₺{formatMoney(targets.reduce((sum, t) => {
                          return sum + calculateBonus(t.achieved_sales, t.sales_target, salesTiers) + 
                                 calculateBonus(t.achieved_collection, t.collection_target, collectionTiers);
                        }, 0))}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-slate-500 text-center py-8">Bu dönem için hedef tanımlanmamış</p>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
