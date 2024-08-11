import React from "react";
import {
  Card,
  Typography,
  List,
  ListItem,
  ListItemPrefix,
  Accordion,
  AccordionHeader,
  AccordionBody,
} from "@material-tailwind/react";
import {
  PresentationChartBarIcon,
  PowerIcon,
  ChartPieIcon,
  UserIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/solid";
import { ChevronRightIcon, ChevronDownIcon } from "@heroicons/react/24/outline";

import { useAuth } from "../../../../hooks/useAuth";

export default function Sidebar() {
  const [open, setOpen] = React.useState(0);

  const { logout } = useAuth();

  const handleOpen = (value) => {
    setOpen(open === value ? 0 : value);
  };

  return (
    <Card className="h-[calc(100vh)] w-full max-w-[20rem] bg-gray-100 p-4 shadow-xl shadow-blue-gray-900/5">
      <div className="flex items-center justify-center mb-6">
        <Typography variant="h6" className="ml-2">
          KCC PP CRM
        </Typography>
      </div>
      <List>
        <a href="/">
          <ListItem>
            <ListItemPrefix>
              <UserIcon className="h-5 w-5" />
            </ListItemPrefix>
            Профиль
          </ListItem>
        </a>
        <a href="/dashboard">
          <ListItem>
            <ListItemPrefix>
              <ChartPieIcon className="h-5 w-5" />
            </ListItemPrefix>
            Панель уплавления
          </ListItem>
        </a>
        <Accordion
          open={open === 1}
          icon={
            <ChevronDownIcon
              strokeWidth={2.5}
              className={`mx-auto h-4 w-4 transition-transform ${open === 1 ? "rotate-180" : ""}`}
            />
          }
        >
          <ListItem className="p-0" selected={open === 1}>
            <AccordionHeader onClick={() => handleOpen(1)} className="border-b-0 p-3">
              <ListItemPrefix>
                <PresentationChartBarIcon className="h-5 w-5" />
              </ListItemPrefix>
              <Typography color="blue-gray" className="mr-auto font-normal">
                Отчеты
              </Typography>
            </AccordionHeader>
          </ListItem>
          <AccordionBody className="py-1">
            <List className="p-0">
              <a href="/graphs">
                <ListItem>
                  <ListItemPrefix>
                    <ChevronRightIcon strokeWidth={3} className="h-3 w-5" />
                  </ListItemPrefix>
                  Графики
                </ListItem>
              </a>
            </List>
          </AccordionBody>
        </Accordion>
        <hr className="my-2 border-blue-gray-50" />
        <button onClick={logout}>
          <ListItem>
            <ListItemPrefix>
              <PowerIcon className="h-5 w-5" />
            </ListItemPrefix>
            Выйти
          </ListItem>
        </button>
      </List>
    </Card>
  );
}
