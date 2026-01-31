'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { Filter, Users, MapPin } from 'lucide-react';

interface SalesPerson {
  id: string;
  name: string;
  region: string;
}

interface SalesFilterProps {
  onFilterChange: (filters: { region: string; personId: string }) => void;
}

export default function SalesFilter({ onFilterChange }: SalesFilterProps) {
  const [salesTeam, setSalesTeam] = useState<SalesPerson[]>([]);
  const [regions, setRegions] = useState<string[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [selectedPerson, setSelectedPerson] = useState<string>('');
  const supabase = createClient();

  useEffect(() => {
    loadSalesTeam();
  }, []);

  const loadSalesTeam = async () => {
    const { data } = await supabase
      .from('sales_team')
      .select('id, name, region')
      .eq('is_active', true)
      .order('name');
    
    if (data) {
      setSalesTeam(data);
      const uniqueRegions = [...new Set(data.map(p => p.region).filter(Boolean))];
      setRegions(uniqueRegions as string[]);
    }
  };

  const handleRegionChange = (region: string) => {
    setSelectedRegion(region);
    setSelectedPerson('');
    onFilterChange({ region, personId: '' });
  };

  const handlePersonChange = (personId: string) => {
    setSelectedPerson(personId);
    onFilterChange({ region: selectedRegion, personId });
  };

  const filteredPeople = selectedRegion
    ? salesTeam.filter(p => p.region === selectedRegion)
    : salesTeam;

  const clearFilters = () => {
    setSelectedRegion('');
    setSelectedPerson('');
    onFilterChange({ region: '', personId: '' });
  };

  const hasFilters = selectedRegion || selectedPerson;

  return (
    <div className="flex flex-wrap items-center gap-3 p-4 bg-gradient-to-r from-slate-50 to-white rounded-xl border border-slate-200 shadow-sm mb-6">
      <div className="flex items-center gap-2 text-slate-600">
        <Filter className="h-4 w-4" />
        <span className="text-sm font-semibold">Filtrele:</span>
      </div>

      {/* Bölge Filtresi */}
      <div className="flex items-center gap-2">
        <MapPin className="h-4 w-4 text-green-500" />
        <select
          value={selectedRegion}
          onChange={(e) => handleRegionChange(e.target.value)}
          className="h-9 px-3 rounded-lg border border-slate-200 bg-white text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        >
          <option value="">Tüm Bölgeler</option>
          {regions.map(region => (
            <option key={region} value={region}>{region}</option>
          ))}
        </select>
      </div>

      {/* Satış Uzmanı Filtresi */}
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-purple-500" />
        <select
          value={selectedPerson}
          onChange={(e) => handlePersonChange(e.target.value)}
          className="h-9 px-3 rounded-lg border border-slate-200 bg-white text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        >
          <option value="">Tüm Uzmanlar</option>
          {filteredPeople.map(person => (
            <option key={person.id} value={person.id}>{person.name}</option>
          ))}
        </select>
      </div>

      {/* Temizle Butonu */}
      {hasFilters && (
        <button
          onClick={clearFilters}
          className="h-9 px-4 text-sm text-white bg-red-500 hover:bg-red-600 rounded-lg"
        >
          ✕ Temizle
        </button>
      )}
    </div>
  );
}
