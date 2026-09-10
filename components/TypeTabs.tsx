'use client';

export type TabValue = 'all' | 'rickshaw' | 'redi' | 'bike' | 'chinchi';

export default function TypeTabs({
  active,
  onChange,
}: {
  active: TabValue;
  onChange: (tab: TabValue) => void;
}) {
  const tabs: { value: TabValue; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'rickshaw', label: '🛺 Rickshaw' },
    { value: 'redi', label: '🛒 Redi' },
    { value: 'chinchi', label: '🍡 Chinchi' },
  ];

  return (
    <div className="type-tabs">
      {tabs.map((t) => (
        <button
          key={t.value}
          className={'type-tab' + (active === t.value ? ' active' : '')}
          onClick={() => onChange(t.value)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}