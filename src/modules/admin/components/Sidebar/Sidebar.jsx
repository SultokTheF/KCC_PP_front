import React from "react";
import {
  Card,
  Typography,
  List,
  ListItem,
  ListItemPrefix,
  ListItemSuffix,
  Chip,
  Accordion,
  AccordionHeader,
  AccordionBody,
} from "@material-tailwind/react";
import {
  PresentationChartBarIcon,
  ShoppingBagIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  InboxIcon,
  PowerIcon,
  UserIcon,
  DocumentTextIcon,
  CodeBracketSquareIcon,
  CurrencyDollarIcon,
  FolderMinusIcon
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
      <List>
        <a href="/">
          <ListItem>
            <ListItemPrefix>
              <UserIcon className="h-5 w-5" />
            </ListItemPrefix>
            Профиль
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
              <a href="/reports/graphs">
                <ListItem>
                  <ListItemPrefix>
                    <ChevronRightIcon strokeWidth={3} className="h-3 w-5" />
                  </ListItemPrefix>
                  Графики
                </ListItem>
              </a>
              <a href="/reports/disbalance">
                <ListItem>
                  <ListItemPrefix>
                    <ChevronRightIcon strokeWidth={3} className="h-3 w-5" />
                  </ListItemPrefix>
                  Экспорт планов
                </ListItem>
              </a>
              <a href="/reports/history">
                <ListItem>
                  <ListItemPrefix>
                    <ChevronRightIcon strokeWidth={3} className="h-3 w-5" />
                  </ListItemPrefix>
                  История
                </ListItem>
              </a>
              <a href="/reports/hour-report">
                <ListItem>
                  <ListItemPrefix>
                    <ChevronRightIcon strokeWidth={3} className="h-3 w-5" />
                  </ListItemPrefix>
                  Отчетные тарифы
                </ListItem>
              </a>
              <a href="/reports/hour-table">
                <ListItem>
                  <ListItemPrefix>
                    <ChevronRightIcon strokeWidth={3} className="h-3 w-5" />
                  </ListItemPrefix>
                  Просмотр данных
                </ListItem>
              </a>
            </List>
          </AccordionBody>
        </Accordion>
        <Accordion
          open={open === 4}
          icon={
            <ChevronDownIcon
              strokeWidth={2.5}
              className={`mx-auto h-4 w-4 transition-transform ${open === 4 ? "rotate-180" : ""}`}
            />
          }
        >
          <ListItem className="p-0" selected={open === 4}>
            <AccordionHeader onClick={() => handleOpen(4)} className="border-b-0 p-3">
              <ListItemPrefix>
                <CurrencyDollarIcon className="h-5 w-5" />
              </ListItemPrefix>
              <Typography color="blue-gray" className="mr-auto font-normal">
                Тарифы
              </Typography>
            </AccordionHeader>
          </ListItem>
          <AccordionBody className="py-1">
            <List className="p-0">
              <a href="/tariffs/prediction">
                <ListItem>
                  <ListItemPrefix>
                    <ChevronRightIcon strokeWidth={3} className="h-3 w-5" />
                  </ListItemPrefix>
                    Фактические тарифы
                </ListItem>
              </a>
              {/* <a href="/tariffs/disbalance">
                <ListItem>
                  <ListItemPrefix>
                    <ChevronRightIcon strokeWidth={3} className="h-3 w-5" />
                  </ListItemPrefix>
                  Дисбаланс
                </ListItem>
              </a> */}
              <a href="/tariffs/ind-prov">
                <ListItem>
                  <ListItemPrefix>
                    <ChevronRightIcon strokeWidth={3} className="h-3 w-5" />
                  </ListItemPrefix>
                    Предельные тарифы
                </ListItem>
              </a>
              <a href="/tariffs/directions">
                <ListItem>
                  <ListItemPrefix>
                    <ChevronRightIcon strokeWidth={3} className="h-3 w-5" />
                  </ListItemPrefix>
                    Направления Часов
                </ListItem>
              </a>
              <a href="/tariffs/volumes">
                <ListItem>
                  <ListItemPrefix>
                    <ChevronRightIcon strokeWidth={3} className="h-3 w-5" />
                  </ListItemPrefix>
                    Объемные тарифы
                </ListItem>
              </a>
              <a href="/tariffs/providers">
                <ListItem>
                  <ListItemPrefix>
                    <ChevronRightIcon strokeWidth={3} className="h-3 w-5" />
                  </ListItemPrefix>
                    Провайдеры
                </ListItem>
              </a>
            </List>
          </AccordionBody>
        </Accordion>
        <Accordion
          open={open === 2}
          icon={
            <ChevronDownIcon
              strokeWidth={2.5}
              className={`mx-auto h-4 w-4 transition-transform ${open === 2 ? "rotate-180" : ""}`}
            />
          }
        >
          <ListItem className="p-0" selected={open === 2}>
            <AccordionHeader onClick={() => handleOpen(2)} className="border-b-0 p-3">
              <ListItemPrefix>
                <DocumentTextIcon className="h-5 w-5" />
              </ListItemPrefix>
              <Typography color="blue-gray" className="mr-auto font-normal">
                Сущности
              </Typography>
            </AccordionHeader>
          </ListItem>
          <AccordionBody className="py-1">
            <List className="p-0">
              <a href="/subjects">
                <ListItem>
                  <ListItemPrefix>
                    <ChevronRightIcon strokeWidth={3} className="h-3 w-5" />
                  </ListItemPrefix>
                  Субъекты
                </ListItem>
              </a>
              <a href="/objects">
                <ListItem>
                  <ListItemPrefix>
                    <ChevronRightIcon strokeWidth={3} className="h-3 w-5" />
                  </ListItemPrefix>
                  Объекты
                </ListItem>
              </a>
            </List>
          </AccordionBody>
        </Accordion>
        <Accordion
          open={open === 3}
          icon={
            <ChevronDownIcon
              strokeWidth={2.5}
              className={`mx-auto h-4 w-4 transition-transform ${open === 1 ? "rotate-180" : ""}`}
            />
          }
        >
          <ListItem className="p-0" selected={open === 3}>
            <AccordionHeader onClick={() => handleOpen(3)} className="border-b-0 p-3">
              <ListItemPrefix>
                <CodeBracketSquareIcon className="h-5 w-5" />
              </ListItemPrefix>
              <Typography color="blue-gray" className="mr-auto font-normal">
                Операции
              </Typography>
            </AccordionHeader>
          </ListItem>
          <AccordionBody className="py-1">
            <List className="p-0">
              <a href="/holidays">
                <ListItem>
                  <ListItemPrefix>
                    <ChevronRightIcon strokeWidth={3} className="h-3 w-5" />
                  </ListItemPrefix>
                  Добавить праздники
                </ListItem>
              </a>
            </List>
          </AccordionBody>
        </Accordion>
        <Accordion
          open={open === 5}
          icon={
            <ChevronDownIcon
              strokeWidth={2.5}
              className={`mx-auto h-4 w-4 transition-transform ${open === 5 ? "rotate-180" : ""}`}
            />
          }
        >
          <ListItem className="p-0" selected={open === 5}>
            <AccordionHeader onClick={() => handleOpen(5)} className="border-b-0 p-3">
              <ListItemPrefix>
                <FolderMinusIcon className="h-5 w-5" />
              </ListItemPrefix>
              <Typography color="blue-gray" className="mr-auto font-normal">
                Отчетные формы
              </Typography>
            </AccordionHeader>
          </ListItem>
          <AccordionBody className="py-1">
            <List className="p-0">
              <a href="/forms/table">
                <ListItem>
                  <ListItemPrefix>
                    <ChevronRightIcon strokeWidth={3} className="h-3 w-5" />
                  </ListItemPrefix>
                    Конструктор отчетов
                </ListItem>
              </a>
              <a href="/forms/formula">
                <ListItem>
                  <ListItemPrefix>
                    <ChevronRightIcon strokeWidth={3} className="h-3 w-5" />
                  </ListItemPrefix>
                    Конструктор формул
                </ListItem>
              </a>
            </List>
          </AccordionBody>
        </Accordion>
        <hr className="my-2 border-blue-gray-50" />
        <a href="/users">
          <ListItem>
            <ListItemPrefix>
              <UserCircleIcon className="h-5 w-5" />
            </ListItemPrefix>
            Пользователи
          </ListItem>
        </a>
        {/* <ListItem>
          <ListItemPrefix>
            <Cog6ToothIcon className="h-5 w-5" />
          </ListItemPrefix>
          Настройки
        </ListItem> */}
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
