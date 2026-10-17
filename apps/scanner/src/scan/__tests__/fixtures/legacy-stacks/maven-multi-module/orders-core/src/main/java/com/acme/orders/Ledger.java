package com.acme.orders;

import org.springframework.context.support.ClassPathXmlApplicationContext;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

public class Ledger {

    private static final Logger LOG = LogManager.getLogger(Ledger.class);

    public static void main(String[] args) {
        LOG.info("starting legacy ledger");
        ClassPathXmlApplicationContext context = new ClassPathXmlApplicationContext("spring-context.xml");
        context.start();
    }
}
