type StructuredMerkleProof = {
  witness_event_id: string;
  depth: string;
  left_leaf: string;
  right_leaf: string;
  successor: string;
};

export type Witness = {
  witness_event_id: string;
  domain_id: string;
  domain_snapshot_title: string;
  witness_hash: string;
  domain_snapshot_genesis_hash: string;
  merkle_root: string;
  witness_event_verification_hash: string;
  witness_network: string;
  smart_contract_address: string;
  witness_event_transaction_hash: string;
  sender_account_address: string;
  source: string; // default | ?
  structured_merkle_proof: StructuredMerkleProof[];
};

export type SignatureData = {
  signature: string;
  public_key: string;
  wallet_address: string;
  signature_hash: string;
};

export type SignatureStatus = "VALID" | "MISSING" | undefined;
