import BankSetupModal from '../../BankSetupModal';
import AddPropertyModal from '../../AddPropertyModal';
import AddCarModal from '../../AddCarModal';
import CreateHotelModal from '../../CreateHotelModal';
import AddVipModal from '../../AddVipModal';
import EditVipModal from '../../EditVipModal';
import EditCarModal from '../../EditCarModal';
import EditPropertyModal from '../../EditPropertyModal';
import EditHotelModal from '../../EditHotelModal';

// Every add / edit / bank modal on the host dashboard. After a change the data is reloaded.
export default function HostModals({ modals, remember, onChanged, notify }) {
  const { open, editing, closeModal, stopEditing } = modals;
  const isVipCategory = (created) => String(created?.category || '').toUpperCase().includes('VIP');

  return (
    <>
      <BankSetupModal isOpen={open.bank} onClose={() => closeModal('bank')} onSuccess={() => notify('Bank account saved. Your payouts are set up.', 'success')} />
      <AddPropertyModal isOpen={open.property} onClose={() => closeModal('property')} onPropertyAdded={(created) => { remember(isVipCategory(created) ? 'VIP' : 'SHORTLET', created); onChanged(); }} />
      <AddCarModal isOpen={open.car} onClose={() => closeModal('car')} onCarAdded={(created) => { remember('CAR', created); onChanged(); }} />
      <CreateHotelModal isOpen={open.hotel} onClose={() => closeModal('hotel')} onSuccess={(created) => { remember('HOTEL', created?.hotel || created); onChanged(); }} />
      <AddVipModal isOpen={open.vip} onClose={() => closeModal('vip')} onEstablishmentAdded={(created) => { remember(String(created?.category || '').toUpperCase() === 'VIP_SERVICE' ? 'VIP_SERVICE' : 'VIP', created); onChanged(); }} />

      <EditCarModal isOpen={!!editing.car} carId={editing.car} onClose={() => stopEditing('car')} onSuccess={onChanged} />
      <EditPropertyModal isOpen={!!editing.property} propertyId={editing.property} onClose={() => stopEditing('property')} onSuccess={onChanged} />
      <EditHotelModal isOpen={!!editing.hotel} hotelId={editing.hotel} onClose={() => stopEditing('hotel')} onSuccess={onChanged} />
      <EditVipModal isOpen={!!editing.vip} establishmentId={editing.vip} onClose={() => stopEditing('vip')} onSuccess={onChanged} />
    </>
  );
}
