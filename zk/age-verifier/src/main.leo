program age_verifier.aleo {

  struct AgeProof {
    nullifier: field,
    threshold: u8,
  }

  transition verify_age(
    private birth_timestamp: u64,
    private issuer_signature: signature,
    private issuer_pubkey: address,
    public threshold: u8,
    public current_timestamp: u64,
    public nullifier: field
  ) -> AgeProof {

    // Verify credential issuer signed the birth timestamp
    let msg: field = birth_timestamp as field;
    assert.eq(signature::verify(issuer_signature, issuer_pubkey, msg), true);

    let age_seconds: u64 = current_timestamp - birth_timestamp;
    let required_seconds: u64 = (threshold as u64) * 31536000u64;

    assert(age_seconds >= required_seconds);

    return AgeProof {
      nullifier: nullifier,
      threshold: threshold
    };
  }
}
