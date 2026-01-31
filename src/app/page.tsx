'use client';

import Header from '@/components/Header';
import { Card, CardHeader, CardTitle, CardBody, KPICard, Badge, ProgressBar } from '@/components/ui';
import { formatMoney } from '@/lib/utils';
import {
  DollarSign,
  Users,
  Target,
  Award,
  TrendingUp,
  Building2,
  CheckCircle,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';

interface SalesPerson {
  id: string;
  name: string;
  avatar: string;
  region: string;
}

interface TargetData {
  sales_person_id: string;
  sales_target: number;
  collection_target: number;
  achieved_sales: number;
  achieved_collection: number;
}

interface Opportunity {
  id: string;
  title: string;
  value: number;
  stage: string;
  probability: number;
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [salesTeam, setSalesTeam] = useState<SalesPerson[]>([]);
  const [targets, setTargets] = useState<TargetData[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [stats, setStats] = useState({
    totalSales: 0,
    totalCollection: 0,
    pipelineValue: 0,
    totalBonus: 0,
    customerCount: 0,
    opportunityCount: 0,
    pendingTasks: 0,
    teamCount: 0,
  });

  const supabase = createClient();

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Satış ekibi
      const { data: teamData, error: teamError } = await supabase
        .from('sales_team')
        .select('*')
        .eq('status', 'active');
      
      if (teamError) throw teamError;
      setSalesTeam(teamData || []);

      // Hedefler
      const { data: targetData, error: targetError } = await supabase
        .from('targets')
        .select('*');
      
      if (targetError) throw targetError;
      setTargets(targetData || []);

      // Fırsatlar
      const { data: oppData, error: oppError } = await supabase
        .from('opportunities')
        .select('*')
        .neq('stage', 'Kaybedildi');
      
      if (oppError) throw oppError;
      setOpportunities(oppData || []);

      // Müşteri sayısı
      const { count: customerCount } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true });

      // Bekleyen görevler
      const { count: taskCount } = await supabase
        .from('crm_tasks')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // İstatistikleri hesapla
      const totalSales = (targetData || []).reduce((sum, t) => sum + (t.achieved_sales || 0), 0);
      const totalCollection = (targetData || []).reduce((sum, t) => sum + (t.achieved_collection || 0), 0);
      const pipelineValue = (oppData || []).reduce((sum, o) => sum + (o.value || 0), 0);

      setStats({
        totalSales,
        totalCollection,
        pipelineValue,
        totalBonus: 0, // Prim hesaplama eklenebilir
        customerCount: customerCount || 0,
        opportunityCount: oppData?.length || 0,
        pendingTasks: taskCount || 0,
        teamCount: teamData?.length || 0,
      });

    } catch (err: any) {
      console.error('Veri çekme hatası:', err);
      setError(err.message || 'Veriler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600 mx-auto" />
          <p className="mt-2 text-sm text-slate-500">Veriler yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <Header title="Dashboard" />
        <div className="p-6">
          <Card className="border-red-200 bg-red-50">
            <CardBody>
              <div className="text-center py-8">
                <p className="text-red-600 font-medium">Bağlantı Hatası</p>
                <p className="text-sm text-red-500 mt-1">{error}</p>
                <button 
                  onClick={fetchData}
                  className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Tekrar Dene
                </button>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header title="Dashboard" />
      
      <div className="p-6">
        {/* Refresh Button */}
        <div className="mb-4 flex justify-end">
          <button 
            onClick={fetchData}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
          >
            <RefreshCw className="h-4 w-4" />
            Yenile
          </button>
        </div>

        {/* KPI Cards */}
        <div className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <KPICard
            label="Toplam Satış"
            value={`₺${formatMoney(stats.totalSales)}`}
            icon={<DollarSign className="h-5 w-5" />}
            color="indigo"
          />
          <KPICard
            label="Toplam Tahsilat"
            value={`₺${formatMoney(stats.totalCollection)}`}
            icon={<CheckCircle className="h-5 w-5" />}
            color="teal"
          />
          <KPICard
            label="Pipeline Değeri"
            value={`₺${formatMoney(stats.pipelineValue)}`}
            icon={<Target className="h-5 w-5" />}
            color="purple"
          />
          <KPICard
            label="Toplam Prim"
            value={`₺${formatMoney(stats.totalBonus)}`}
            icon={<Award className="h-5 w-5" />}
            color="orange"
          />
        </div>

        {/* Secondary Stats */}
        <div className="mb-6 grid gap-4 md:grid-cols-4">
          <Card className="p-4 bg-gradient-to-br from-sky-50 to-blue-50 border-sky-100">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100/80 shadow-sm">
                <Users className="h-5 w-5 text-sky-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{stats.teamCount}</p>
                <p className="text-xs text-slate-500">Satış Ekibi</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-100">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100/80 shadow-sm">
                <Building2 className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{stats.customerCount}</p>
                <p className="text-xs text-slate-500">Müşteri</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-violet-50 to-purple-50 border-violet-100">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100/80 shadow-sm">
                <Target className="h-5 w-5 text-violet-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{stats.opportunityCount}</p>
                <p className="text-xs text-slate-500">Fırsat</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-rose-50 to-pink-50 border-rose-100">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100/80 shadow-sm">
                <Clock className="h-5 w-5 text-rose-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{stats.pendingTasks}</p>
                <p className="text-xs text-slate-500">Bekleyen Görev</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Team Performance */}
          <Card>
            <CardHeader>
              <CardTitle>
                <TrendingUp className="h-4 w-4" />
                Ekip Performansı
              </CardTitle>
            </CardHeader>
            <CardBody className="space-y-4">
              {salesTeam.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Users className="h-12 w-12 mx-auto text-slate-300" />
                  <p className="mt-2">Henüz satış ekibi eklenmemiş</p>
                  <a href="/team" className="text-blue-600 text-sm hover:underline">Ekip ekle →</a>
                </div>
              ) : (
                salesTeam.map((person) => {
                  const target = targets.find(t => t.sales_person_id === person.id);
                  const salesRate = target && target.sales_target > 0 
                    ? Math.round((target.achieved_sales / target.sales_target) * 100) 
                    : 0;
                  const collectionRate = target && target.collection_target > 0 
                    ? Math.round((target.achieved_collection / target.collection_target) * 100) 
                    : 0;
                  
                  return (
                    <div key={person.id} className="rounded-lg bg-slate-50 p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{person.avatar}</span>
                          <div>
                            <p className="text-sm font-medium text-slate-900">{person.name}</p>
                            <p className="text-xs text-slate-500">{person.region}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-slate-900">₺{formatMoney(target?.achieved_sales || 0)}</p>
                          <Badge variant={salesRate >= 100 ? 'success' : salesRate >= 80 ? 'warning' : 'default'}>
                            {salesRate}%
                          </Badge>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <span className="w-14">Satış</span>
                          <div className="flex-1">
                            <ProgressBar 
                              value={salesRate} 
                              max={100} 
                              color={salesRate >= 100 ? 'teal' : 'indigo'} 
                              showLabel={false} 
                            />
                          </div>
                          <span className="w-10 text-right">{salesRate}%</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <span className="w-14">Tahsilat</span>
                          <div className="flex-1">
                            <ProgressBar 
                              value={collectionRate} 
                              max={100} 
                              color={collectionRate >= 100 ? 'teal' : 'purple'} 
                              showLabel={false} 
                            />
                          </div>
                          <span className="w-10 text-right">{collectionRate}%</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </CardBody>
          </Card>

          {/* Opportunities */}
          <Card>
            <CardHeader>
              <CardTitle>
                <Target className="h-4 w-4" />
                Aktif Fırsatlar
              </CardTitle>
            </CardHeader>
            <CardBody className="space-y-3">
              {opportunities.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Target className="h-12 w-12 mx-auto text-slate-300" />
                  <p className="mt-2">Henüz fırsat eklenmemiş</p>
                  <a href="/opportunities" className="text-blue-600 text-sm hover:underline">Fırsat ekle →</a>
                </div>
              ) : (
                opportunities.slice(0, 5).map((opp) => (
                  <div key={opp.id} className="flex items-center justify-between rounded-lg border border-slate-100 p-3">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{opp.title}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <Badge variant={
                          opp.stage === 'Kapanış' ? 'success' :
                          opp.stage === 'Müzakere' ? 'warning' :
                          opp.stage === 'Teklif' ? 'info' : 'default'
                        }>
                          {opp.stage}
                        </Badge>
                        <span className="text-xs text-slate-500">{opp.probability}% olasılık</span>
                      </div>
                    </div>
                    <p className="text-lg font-bold text-blue-600">₺{formatMoney(opp.value)}</p>
                  </div>
                ))
              )}
            </CardBody>
          </Card>
        </div>

        {/* Success Banner */}
        <Card className="mt-6 border-green-200 bg-green-50">
          <CardBody>
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-green-900">Supabase Bağlantısı Aktif ✅</h3>
                <p className="mt-1 text-sm text-green-700">
                  Veritabanı bağlantısı başarılı. Şimdi Satış Ekibi sayfasından ekip üyesi ekleyebilirsin.
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
