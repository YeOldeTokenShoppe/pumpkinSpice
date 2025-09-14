import TorchSection from '@/components/TorchSection';

export default function IntegratedDemoPage() {
  return (
    <div>
      {/* Regular content section */}
      <section style={{ padding: '4rem 2rem', background: '#111', color: 'white' }}>
        <h1 style={{ fontSize: '3rem', textAlign: 'center' }}>Welcome to the Dungeon</h1>
        <p style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
          Scroll down to explore the mysterious depths below...
        </p>
      </section>

      {/* Torch illuminated section */}
      <TorchSection
        backgroundImage="https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?q=80&w=2000"
        height="80vh"
        overlayOpacity={0.92}
        initialRadius={180}
      >
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '3rem', marginBottom: '1rem', textShadow: '0 0 20px rgba(249, 170, 71, 0.5)' }}>
            Explore the Darkness
          </h2>
          <p style={{ fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto' }}>
            Move your cursor to illuminate the ancient corridors
          </p>
        </div>
      </TorchSection>

      {/* Another regular section */}
      <section style={{ padding: '4rem 2rem', background: '#111', color: 'white' }}>
        <h2 style={{ fontSize: '2rem', textAlign: 'center' }}>Continue Your Journey</h2>
        <p style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
          The torch effect above creates an immersive exploration experience...
        </p>
      </section>
    </div>
  );
}