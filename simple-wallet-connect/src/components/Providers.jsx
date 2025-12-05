import React from 'react';
import '@iota/dapp-kit/dist/index.css';
import { IotaClientProvider, WalletProvider } from '@iota/dapp-kit';
import { getFullnodeUrl } from '@iota/iota-sdk/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

const networks = {
	testnet: { url: getFullnodeUrl('testnet') },
	mainnet: { url: getFullnodeUrl('mainnet') },
};

export function Providers({ children }) {
	return (
		<QueryClientProvider client={queryClient}>
			<IotaClientProvider networks={networks} defaultNetwork="testnet">
				<WalletProvider autoConnect={true}>
					{children}
				</WalletProvider>
			</IotaClientProvider>
		</QueryClientProvider>
	);
}
