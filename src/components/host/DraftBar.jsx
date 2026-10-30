import { Save } from 'lucide-react';

export default function DraftBar({ savedAt, onExit, onDiscard }) {
  if (!savedAt) {
    return (
      <p className="text-sm text-gray-500 flex items-center gap-2">
        <Save className="w-4 h-4" /> Your progress is saved automatically as a draft on this device. Photos are not saved.
      </p>
    );
  }
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 rounded-xl bg-blue-50 border border-blue-100">
      <p className="text-sm font-semibold text-blue-800 flex items-center gap-2">
        <Save className="w-4 h-4" /> Draft saved {new Date(savedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}. Photos are not saved.
      </p>
      <div className="flex gap-3">
        <button type="button" onClick={onExit} className="text-sm font-bold text-blue-800 hover:underline">Save and exit</button>
        <button type="button" onClick={onDiscard} className="text-sm font-bold text-red-600 hover:underline">Discard draft</button>
      </div>
    </div>
  );
}
