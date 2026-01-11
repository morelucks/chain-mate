// Local development manifest - create contract/manifest_dev.json for localhost
// import localhost from "../../../contract/manifest_dev.json";
import sepoliaData from "./manifest_sepolia.json"; // sepolia manifest

// Using the same manifest for now - update when mainnet manifest is available
const mainnet = sepoliaData;
const slot = sepoliaData;
const sepolia = sepoliaData;
const localhost = sepoliaData; // Fallback to sepolia until local manifest is created

// Define valid deploy types
type DeployType = keyof typeof manifests;

// Create the manifests object
const manifests = {
  localhost,
  mainnet,
  sepolia,
  slot,
};

// Get deployment type from environment with fallback
const deployType = import.meta.env.VITE_PUBLIC_DEPLOY_TYPE as string;

// Export the appropriate manifest with a fallback
export const manifest = deployType in manifests
  ? manifests[deployType as DeployType]
  : sepolia;

export type Manifest = typeof manifest;
