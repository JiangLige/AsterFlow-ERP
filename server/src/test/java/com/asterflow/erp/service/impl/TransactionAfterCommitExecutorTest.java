package com.asterflow.erp.service.impl;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;

class TransactionAfterCommitExecutorTest {

    private final TransactionAfterCommitExecutor executor = new TransactionAfterCommitExecutor();

    @AfterEach
    void clearSynchronization() {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.clearSynchronization();
        }
        TransactionSynchronizationManager.setActualTransactionActive(false);
    }

    @Test
    void executesImmediatelyWhenNoTransactionSynchronizationExists() {
        AtomicInteger executions = new AtomicInteger();

        executor.execute(executions::incrementAndGet);

        assertThat(executions).hasValue(1);
    }

    @Test
    void defersExecutionUntilTransactionCommit() {
        AtomicInteger executions = new AtomicInteger();
        TransactionSynchronizationManager.initSynchronization();
        TransactionSynchronizationManager.setActualTransactionActive(true);

        executor.execute(executions::incrementAndGet);

        assertThat(executions).hasValue(0);
        TransactionSynchronizationManager.getSynchronizations()
                .forEach(TransactionSynchronization::afterCommit);
        assertThat(executions).hasValue(1);
    }

    @Test
    void skipsExecutionWhenTransactionRollsBack() {
        AtomicInteger executions = new AtomicInteger();
        TransactionSynchronizationManager.initSynchronization();
        TransactionSynchronizationManager.setActualTransactionActive(true);

        executor.execute(executions::incrementAndGet);

        TransactionSynchronizationManager.getSynchronizations()
                .forEach(synchronization -> synchronization.afterCompletion(
                        TransactionSynchronization.STATUS_ROLLED_BACK
                ));

        assertThat(executions).hasValue(0);
    }

    @Test
    void executesImmediatelyWhenSynchronizationHasNoActualTransaction() {
        AtomicInteger executions = new AtomicInteger();
        TransactionSynchronizationManager.initSynchronization();

        executor.execute(executions::incrementAndGet);

        assertThat(executions).hasValue(1);
    }
}
