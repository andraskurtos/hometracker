import Launchpad from "./components/Launchpad"
import Navbar from "./components/Navbar"

function App() {
  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col text-neutral-200">
      <Navbar />
      <main className="flex-1 flex items-center justify-center p-6">
        <Launchpad />
      </main>
    </div>
  )
}

export default App