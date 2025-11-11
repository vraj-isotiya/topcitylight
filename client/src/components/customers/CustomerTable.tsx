import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";

import { Trash2 } from "lucide-react";

interface CustomerTableProps {
  customers: any[];
  onSelectCustomer: (customer: any) => void;
  onEditCustomer: (customer: any) => void;
  onDeleteCustomer: (id: string) => void;
  loading: boolean;
}

export const CustomerTable = ({
  customers,
  onSelectCustomer,
  onEditCustomer,
  onDeleteCustomer,
  loading,
}: CustomerTableProps) => {
  if (loading) {
    return (
      <Card className="p-6">
        <p className="text-center text-muted-foreground">
          Loading customers...
        </p>
      </Card>
    );
  }

  if (customers.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-center text-muted-foreground">No customers found</p>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      {/* Responsive wrapper: adds scroll on small devices */}
      <div className="w-full overflow-x-auto">
        <Table className="min-w-[700px] text-sm sm:text-base">
          <TableHeader>
            <TableRow>
              <TableHead className="whitespace-nowrap">Name</TableHead>
              <TableHead className="whitespace-nowrap">Email</TableHead>
              <TableHead className="whitespace-nowrap">Phone</TableHead>
              <TableHead className="whitespace-nowrap">Company</TableHead>
              <TableHead className="whitespace-nowrap">Status</TableHead>
              <TableHead className="whitespace-nowrap text-center">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map((customer) => (
              <TableRow
                key={customer.id}
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => onSelectCustomer(customer)}
              >
                <TableCell className="font-medium truncate max-w-[180px]">
                  {customer.name || "-"}
                </TableCell>
                <TableCell className="truncate max-w-[200px]">
                  {customer.email || "-"}
                </TableCell>
                <TableCell className="truncate max-w-[120px]">
                  {customer.phone || "-"}
                </TableCell>
                <TableCell className="truncate max-w-[160px]">
                  {customer.company || "-"}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      customer.status === "Customer" ? "default" : "secondary"
                    }
                    className="text-xs sm:text-sm"
                  >
                    {customer.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditCustomer(customer);
                    }}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDeleteCustomer(customer.id)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
};
