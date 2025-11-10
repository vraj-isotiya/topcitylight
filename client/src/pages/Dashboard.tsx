import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Mail, TrendingUp } from "lucide-react";
import axiosClient from "@/lib/axiosClient";
import { Skeleton } from "@/components/ui/skeleton";

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalCustomers: 0,
    leads: 0,
    prospects: 0,
    emailsSent: 0,
    replyRate: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      // Fetch all customers from backend
      const res = await axiosClient.get("/customers/all");

      let totalCustomers = 0;
      let leads = 0;
      let prospects = 0;

      if (res.data?.success && Array.isArray(res.data.data.customers)) {
        const customers = res.data.data.customers;

        totalCustomers = customers.length;
        leads = customers.filter((c) => c.status === "Lead").length;
        prospects = customers.filter((c) => c.status === "Prospect").length;
      }

      //  Fetch email stats from backend
      const mailRes = await axiosClient.get("/mail/all");

      let emailsSent = 0;
      let repliedThreads = 0;
      let totalThreads = 0;

      if (mailRes.data?.success && Array.isArray(mailRes.data.data.threads)) {
        const threads = mailRes.data.data.threads;

        totalThreads = threads.length;
        emailsSent = threads.filter(
          (thread) => thread.status === "sent" || thread.status === "replied"
        ).length;

        // Threads with replies
        repliedThreads = threads.filter(
          (thread) => thread.replies && thread.replies.length > 0
        ).length;
      }

      //  Calculate reply rate
      const replyRate = totalThreads
        ? Math.round((repliedThreads / totalThreads) * 100)
        : 0;

      setStats({
        totalCustomers,
        leads,
        prospects,
        emailsSent,
        replyRate,
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: "Total Customers",
      value: stats.totalCustomers,
      icon: Users,
      subtitle: `${stats.leads} Leads, ${stats.prospects} Prospects`,
    },
    {
      title: "Emails Sent This Month",
      value: stats.emailsSent,
      icon: Mail,
    },
    {
      title: "Email Reply Rate",
      value: `${stats.replyRate}%`,
      icon: TrendingUp,
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {loading
          ? [...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-4 w-32 mb-2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-20 mb-2" />
                  <Skeleton className="h-3 w-24" />
                </CardContent>
              </Card>
            ))
          : statCards.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card key={index}>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </CardTitle>
                    <Icon className="w-4 h-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{stat.value}</div>
                    {stat.subtitle && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {stat.subtitle}
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Welcome to Your CRM</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Manage your customers, track communications, and grow your business
            efficiently.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
