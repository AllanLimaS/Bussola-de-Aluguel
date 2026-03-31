import React from 'react';
import { Bed, Bath, Car, Maximize2 } from 'lucide-react';

const AttributeItem = ({ Icon, value, label }) => (
  <div className="bg-slate-800/40 p-5 rounded-2xl text-center border border-slate-800 hover:border-slate-700 transition-all hover:bg-slate-800/60 group">
    <Icon className="mx-auto text-indigo-400 mb-2 group-hover:scale-110 transition-transform" size={28} />
    <div className="text-xl font-black text-slate-100 tracking-tight">{value}</div>
    <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest mt-0.5">{label}</div>
  </div>
);

const AttributeGrid = ({ imovel }) => {
  if (!imovel) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <AttributeItem Icon={Bed} value={imovel.quartos} label="Quartos" />
      <AttributeItem Icon={Bath} value={imovel.banheiros} label="Banh." />
      <AttributeItem Icon={Car} value={imovel.vagas} label="Vagas" />
      <AttributeItem Icon={Maximize2} value={`${imovel.metragem}m²`} label="Metros²" />
    </div>
  );
};

export default AttributeGrid;
