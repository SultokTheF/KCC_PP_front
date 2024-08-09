import React, { useState, useEffect } from "react";
import { useAuth } from "../../../../hooks/useAuth";

import Day from "./Selectors/Day";
import Month from "./Selectors/Month";
import Year from "./Selectors/Year";

import {
  Navbar,
  Collapse,
  Typography,
  Button,
  Menu,
  MenuHandler,
  MenuList,
  MenuItem,
  Avatar,
  Card,
  IconButton,
} from "@material-tailwind/react";

import {
  UserCircleIcon,
  CodeBracketSquareIcon,
  Square3Stack3DIcon,
  ChevronDownIcon,
  Cog6ToothIcon,
  InboxArrowDownIcon,
  LifebuoyIcon,
  PowerIcon,
  Bars2Icon,
  DocumentIcon,
  PaperClipIcon,
  ClockIcon,
  CalendarDaysIcon,
} from "@heroicons/react/24/solid";

function ProfileMenu() {
  const { logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const closeMenu = () => setIsMenuOpen(false);

  const handleMenuItemClick = (item) => {
    if (item.action === "logout") {
      logout();
    } else if (!item.action) {
      window.location.href = item.link;
    }
    closeMenu();
  };

  return (
    <Menu open={isMenuOpen} handler={setIsMenuOpen} placement="bottom-end">
      <MenuHandler>
        <Button
          variant="text"
          color="blue-gray"
          className="flex items-center gap-1 rounded-full py-0.5 pr-2 pl-0.5"
        >
          <Avatar
            variant="circular"
            size="sm"
            alt="tania andrew"
            className="border border-gray-900 p-0.5"
            src="https://cdn3.iconfinder.com/data/icons/avatars-neutral/48/bl_816_avatar_race_neutral_man_empty_woman_male_female-512.png"
          />
          <ChevronDownIcon
            strokeWidth={2.5}
            className={`h-3 w-3 transition-transform ${
              isMenuOpen ? "rotate-180" : ""
            }`}
          />
        </Button>
      </MenuHandler>
      <MenuList className="p-1 mt-5">
        {profileMenuItems.map(({ label, icon, link, action }, index) => {
          const isLastItem = index === profileMenuItems.length - 1;
          const MenuItemComponent = isLastItem ? "button" : "a";

          return (
            <MenuItem
              key={label}
              onClick={() => handleMenuItemClick({ label, action, link })}
              as={MenuItemComponent}
              href={isLastItem ? undefined : link}
              className={`flex items-center gap-2 rounded ${
                isLastItem
                  ? "hover:bg-red-500/10 focus:bg-red-500/10 active:bg-red-500/10"
                  : ""
              }`}
            >
              {React.createElement(icon, {
                className: `h-4 w-4 ${isLastItem ? "text-red-500" : ""}`,
                strokeWidth: 2,
              })}
              <Typography
                as="span"
                variant="small"
                className="font-normal"
                color={isLastItem ? "red" : "inherit"}
              >
                {label}
              </Typography>
            </MenuItem>
          );
        })}
      </MenuList>
    </Menu>
  );
}

const Calendar = ({ selectedDate, setSelectedDate, holidays }) => {
  const [date, setDate] = useState({
    day: String(new Date().getDate()).padStart(2, "0"),
    month: String(new Date().getMonth() + 1).padStart(2, "0"),
    year: new Date().getFullYear(),
    selectedDate: selectedDate,
  });

  useEffect(() => {
    const updatedDate = new Date(
      `${date.year}-${date.month.toString().padStart(2, "0")}-${date.day
        .toString()
        .padStart(2, "0")}`
    );
    setDate((prevDate) => ({
      ...prevDate,
      selectedDate: updatedDate.toISOString().split("T")[0],
    }));
    setSelectedDate(updatedDate.toISOString().split("T")[0]);
  }, [date.day, date.month, date.year]);

  const [currentTime, setCurrentTime] = React.useState("");
  const [currentDate, setCurrentDate] = React.useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
      setCurrentDate(now.toLocaleDateString());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-gray-100 rounded-lg shadow-lg">
      <div className="flex h-12 w-full bg-gray-200 justify-between items-center rounded-t-lg px-4">
        <div className="mr-4 cursor-pointer py-1.5 font-medium" ></div>
        <div className="flex items-center ml-32">
          <Month date={date} setDate={setDate} />
          <Year date={date} setDate={setDate} />
        </div>
        <div className="flex items-center gap-4">
          <Typography
            variant="small"
            color="gray"
            className="font-medium text-blue-gray-500"
          >
            <MenuItem className="flex items-center gap-2 lg:rounded-full">
              {React.createElement(ClockIcon, { className: "h-[18px] w-[18px]" })}{" "}
              <span className="text-gray-900">
                {currentTime ? `GMT+5 | ${currentTime}` : "GMT+5 | 00:00:00"}
              </span>
            </MenuItem>
          </Typography>
        </div>
      </div>
      <Day date={date} setDate={setDate} holidays={holidays} />
    </div>
  );
};

export default Calendar;
