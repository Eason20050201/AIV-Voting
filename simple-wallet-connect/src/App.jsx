import { WalletConnect } from './components/WalletConnect';
import './App.css';

function App() {
  return (
    <div className="App">
      <h1>Simple IOTA Wallet Connect</h1>
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '50px' }}>
        <WalletConnect />
      </div>
    </div>
  );
}

export default App;
