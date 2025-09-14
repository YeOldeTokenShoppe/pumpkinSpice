import DungeonTorch from '@/components/DungeonTorch';

export default function DungeonDemoPage() {
  return (
    <main style={{ position: 'relative', height: '100vh', overflow: 'hidden' }}>
      <DungeonTorch 
        backgroundImage="https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=2000"
        initialRadius={120}
        showControls={true}
        torchIcon={true}
      />
    </main>
  );
}