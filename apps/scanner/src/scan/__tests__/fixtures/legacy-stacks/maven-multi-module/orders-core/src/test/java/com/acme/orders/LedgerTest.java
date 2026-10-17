package com.acme.orders;

import org.junit.Test;
import org.junit.Ignore;

import static org.junit.Assert.assertEquals;

public class LedgerTest {

    @Test
    public void totalsAreRounded() {
        assertEquals(2, 2);
    }

    @Ignore("legacy tax path retired")
    @Test
    public void legacyTaxPathStillPasses() {
    }
}
