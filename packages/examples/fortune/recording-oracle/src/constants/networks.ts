import { IEscrowNetwork } from '../interfaces/networks';

export enum ChainId {
  GOERLI = 5,
  BSC_TESTNET = 97,
  POLYGON = 137,
  POLYGON_MUMBAI = 80001,
  MOONBASE_ALPHA = 1287,
  LOCALHOST = 1338,
}

export const ESCROW_NETWORKS: {
  [chainId in ChainId]?: IEscrowNetwork;
} = {
  [ChainId.GOERLI]: {
    chainId: ChainId.GOERLI,
    title: 'Ethereum Goerli',
    rpcUrl: 'https://goerli.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
    factoryAddress: '0x87469B4f2Fcf37cBd34E54244c0BD4Fa0603664c',
    hmtAddress: '0xd3A31D57FDD790725d0F6B78095F62E8CD4ab317',
  },
  // [ChainId.POLYGON]: {
  //   chainId: ChainId.POLYGON,
  //   title: 'Polygon',
  //   rpcUrl: 'https://polygon-rpc.com',
  //   factoryAddress: '0x15D55Cb5d9Df6273B296745C3585a94574d2fDd7',
  //   hmtAddress: '0xc748B2A084F8eFc47E086ccdDD9b7e67aEb571BF',
  // },
  [ChainId.BSC_TESTNET]: {
    chainId: ChainId.BSC_TESTNET,
    title: 'Binance Smart Chain (Testnet)',
    rpcUrl: 'https://data-seed-prebsc-1-s3.binance.org:8545',
    factoryAddress: '0x2bfA592DBDaF434DDcbb893B1916120d181DAD18',
    hmtAddress: '0xE3D74BBFa45B4bCa69FF28891fBE392f4B4d4e4d',
  },
  [ChainId.POLYGON_MUMBAI]: {
    chainId: ChainId.POLYGON_MUMBAI,
    title: 'Polygon Mumbai',
    rpcUrl: 'https://rpc-mumbai.maticvigil.com',
    factoryAddress: '0x79aE9b3Ad106AEdc1F813AaD98f550FADd9e2254',
    hmtAddress: '0xc2B8bb720e5df43e6E13b84B27dF5543B3485EA4',
  },
  // [ChainId.MOONBASE_ALPHA]: {
  //   chainId: ChainId.MOONBASE_ALPHA,
  //   title: 'Moonbase Alpha',
  //   rpcUrl: 'https://rpc.api.moonbase.moonbeam.network',
  //   factoryAddress: '0x707fb5A5d36BC15275Af3f73262bf9a1D8C470EB',
  //   hmtAddress: '0xe4C8eC5d057EacF40060b2174627a4941a5c8127',
  // },
  [ChainId.LOCALHOST]: {
    chainId: ChainId.LOCALHOST,
    title: 'Localhost',
    rpcUrl: `http://127.0.0.1:${process.env.RPC_PORT}`,
    factoryAddress: '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9',
    hmtAddress: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
  },
};
