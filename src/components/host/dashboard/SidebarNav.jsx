import { Card } from '../../ui';
import { NAV_ITEMS } from './constants';

export default function SidebarNav({ activeTab, onSelect }) {
  return (
    <aside className="w-full lg:w-64 shrink-0 lg:sticky lg:top-28">
      <Card className="p-2 flex lg:flex-col overflow-x-auto gap-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelect(item.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-base font-semibold whitespace-nowrap transition-colors ${
                active ? 'bg-brand-dark text-white' : 'text-brand-text-secondary hover:bg-gray-50 hover:text-brand-dark'
              }`}
            >
              <Icon className={`w-5 h-5 ${active ? 'text-brand-primary' : ''}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </Card>
    </aside>
  );
}
