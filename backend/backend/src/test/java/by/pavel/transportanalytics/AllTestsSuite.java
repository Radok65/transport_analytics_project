package by.pavel.transportanalytics;

import org.junit.platform.suite.api.SelectPackages;
import org.junit.platform.suite.api.Suite;

@Suite
@SelectPackages({
        "by.pavel.transportanalytics.model",
        "by.pavel.transportanalytics.repository",
        "by.pavel.transportanalytics.service",
        "by.pavel.transportanalytics.controller"
})
public class AllTestsSuite {
}