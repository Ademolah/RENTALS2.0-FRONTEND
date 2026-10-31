import { SelectField } from './Field';
import { LOCATION_DATA } from './constants';

// Section heading with an optional icon, used by the studio-style forms.
export function StudioSectionTitle({ icon: Icon, children }) {
  return (
    <div className="flex items-center space-x-2 mb-6">
      {Icon && <Icon className="w-5 h-5 text-gray-400" />}
      <h3 className="text-xl font-bold text-gray-900 tracking-tight">{children}</h3>
    </div>
  );
}

export const StudioDivider = () => <hr className="border-gray-100" />;

// Price slider card with the 5% commission line (host-side wording only).
export function StudioPriceCard({ label, description, value, onChange, min, max, step, between, footerRight }) {
  return (
    <div className="p-8 rounded-2xl border border-gray-200 bg-gray-50/50">
      <div className="flex justify-between items-end mb-8">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">{label}</label>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
        <div className="text-right">
          <span className="text-4xl font-bold text-gray-900 tracking-tight">₦{Number(value).toLocaleString()}</span>
        </div>
      </div>

      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-900/10"
      />

      {between}

      <div className="flex justify-between items-center text-sm pt-6 mt-6 border-t border-gray-200">
        <span className="text-gray-500 font-medium">Platform commission (5%)</span>
        {footerRight}
      </div>
    </div>
  );
}

// State and city selectors: the city list depends on the chosen state.
export function StateCityFields({ theme, stateName, city, onState, onCity, cityLabel, stateExtra, cityExtra }) {
  return (
    <>
      <SelectField theme={theme} label="State" required value={stateName} onChange={onState} extra={stateExtra}>
        <option value="" disabled>Select State</option>
        {Object.keys(LOCATION_DATA).map((state) => (
          <option key={state} value={state}>{state}</option>
        ))}
      </SelectField>
      <SelectField theme={theme} label={cityLabel} required value={city} onChange={(e) => onCity(e.target.value)} disabled={!stateName} extra={cityExtra}>
        <option value="" disabled>{stateName ? 'Select City' : 'Select State First'}</option>
        {stateName && LOCATION_DATA[stateName]?.map((loc) => (
          <option key={loc} value={loc}>{loc}</option>
        ))}
      </SelectField>
    </>
  );
}
