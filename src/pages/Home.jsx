import PropertyCard from '../components/PropertyCard';

export default function Home() {
  // Dummy data for testing the UI
  const dummyProperties = Array(8).fill(null).map((_, i) => ({
    id: i,
    title: "Luxury Suite with Ocean View",
    location: i % 2 === 0 ? "Ikoyi, Lagos" : "Victoria Island, Lagos",
    price: 150000 + (i * 10000),
    rating: (4.5 + (i % 5) * 0.1).toFixed(2),
    dates: "Oct 12 - 17",
    isRentalVerified: i % 3 === 0,
    isAvailable: i % 4 !== 0,
    image: `https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80`
  }));

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Grid: 1 col on mobile, 2 on tablet, 4 on desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 gap-y-10">
        {dummyProperties.map((prop) => (
          <PropertyCard key={prop.id} property={prop} />
        ))}
      </div>
    </main>
  );
}