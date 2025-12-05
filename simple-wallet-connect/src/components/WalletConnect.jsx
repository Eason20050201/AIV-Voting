import { ConnectModal, useCurrentAccount, useDisconnectWallet, ConnectButton } from '@iota/dapp-kit';

export function WalletConnect() {
	const account = useCurrentAccount();
	const { mutate: disconnect } = useDisconnectWallet();

	return (
		<div style={{ 
			padding: '30px', 
			border: '1px solid rgba(255, 255, 255, 0.1)', 
			borderRadius: '16px', 
			textAlign: 'center',
			background: 'linear-gradient(145deg, #1a1a1a, #2a2a2a)',
			boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
			color: 'white',
			maxWidth: '400px',
			width: '100%'
		}}>
			<h2 style={{ marginBottom: '24px', fontSize: '1.5rem', fontWeight: '600' }}>
				Wallet Connection
			</h2>
			
			{account ? (
				<div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
					{/* Custom UI Section */}
					<div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
						<div style={{ 
							padding: '12px', 
							background: 'rgba(0, 0, 0, 0.2)', 
							borderRadius: '8px',
							fontSize: '0.9rem',
							fontFamily: 'monospace',
							wordBreak: 'break-all'
						}}>
							{account.address}
						</div>
						<button 
							onClick={() => disconnect()}
							style={{
								padding: '10px 20px',
								background: '#ff4d4d',
								border: 'none',
								borderRadius: '8px',
								color: 'white',
								cursor: 'pointer',
								fontWeight: 'bold',
								transition: 'opacity 0.2s'
							}}
						>
							Custom Disconnect
						</button>
					</div>

					{/* Standard UI Section */}
					<div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', width: '100%', paddingTop: '20px' }}>
						<p style={{ marginBottom: '10px', fontSize: '0.8rem', color: '#aaa' }}>Standard Button State:</p>
						<ConnectButton />
					</div>
				</div>
			) : (
				<div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
					<ConnectModal
						trigger={
							<button style={{
								padding: '12px 24px',
								background: 'linear-gradient(90deg, #00d2ff 0%, #3a7bd5 100%)',
								border: 'none',
								borderRadius: '8px',
								color: 'white',
								fontSize: '1rem',
								fontWeight: 'bold',
								cursor: 'pointer',
								boxShadow: '0 4px 15px rgba(0, 210, 255, 0.3)',
								transition: 'transform 0.1s'
							}}>
								Custom Connect ✨
							</button>
						}
					/>
					
					{/* Standard UI Section */}
					<div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', width: '100%', paddingTop: '20px' }}>
						<p style={{ marginBottom: '10px', fontSize: '0.8rem', color: '#aaa' }}>Or use standard button:</p>
						<ConnectButton />
					</div>
				</div>
			)}
		</div>
	);
}

