import React from 'react';
import { ConnectModal, useCurrentAccount, useDisconnectWallet } from '@iota/dapp-kit';
import './WalletConnect.css';

const WalletConnect = () => {
  const account = useCurrentAccount();
  const { mutate: disconnect } = useDisconnectWallet();

  return (
    <div className="wallet-connect-container">
      {account ? (
        <div className="wallet-content">
          {/* Custom UI Section */}
          <div className="custom-ui-section">
            <div className="address-box">
              {account.address}
            </div>
            <button 
              onClick={() => disconnect()}
              className="custom-disconnect-btn"
            >
              Disconnect Wallet
            </button>
          </div>
        </div>
      ) : (
        <div className="wallet-content" style={{ alignItems: 'center' }}>
          <ConnectModal
            trigger={
              <button className="custom-connect-btn">
                Connect Wallet ✨
              </button>
            }
          />
        </div>
      )}
    </div>
  );
};

export default WalletConnect;
