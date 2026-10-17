package com.acme.orders.web;

import javax.servlet.http.HttpServletRequest;
import org.apache.struts2.interceptor.ServletRequestAware;

public class OrderAction implements ServletRequestAware {

    private HttpServletRequest request;

    @Override
    public void setServletRequest(HttpServletRequest request) {
        this.request = request;
    }

    public String execute() {
        request.setAttribute("orders", "loaded");
        return "success";
    }
}
