// The 'test_syntax' program.
program test_syntax.aleo {
    // This is the constructor for the program.
    // The constructor allows you to manage program upgrades.
    // It is called when the program is deployed or upgraded.
    // It is currently configured to **prevent** upgrades.
    // Other configurations include:
    //  - @admin(address="aleo1...")
    //  - @checksum(mapping="credits.aleo/fixme", key="0field")
    //  - @custom
    // For more information, please refer to the documentation: `https://docs.leo-lang.org/guides/upgradability`
    @noupgrade
    async constructor() {}

    async transition main(public a: u32, b: u32) -> Future {
        let c: u32 = a + b;
        return finish_main(c);
    }
    async function finish_main(c: u32) {
        assert_eq(c, 5u32);
    }
}
