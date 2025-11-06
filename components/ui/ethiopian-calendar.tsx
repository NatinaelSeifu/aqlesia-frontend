"use client";

import * as React from "react";
import { Calendar } from "@/components/ui/calendar";
import {
	formatEthiopianDate,
	toEthiopianDate,
	getAmharicMonthName,
	getAmharicDayName,
} from "@/lib/utils";
import { cn } from "@/lib/utils";

interface EthiopianCalendarProps {
	selected?: Date;
	onSelect?: (date: Date | undefined) => void;
	disabled?: (date: Date) => boolean;
	className?: string;
}

export function EthiopianCalendar({
	selected,
	onSelect,
	disabled,
	className,
}: EthiopianCalendarProps) {
	return (
		<div className={cn("space-y-4", className)}>
			{/* Ethiopian Date Display */}
			{selected && (
				<div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
					<div className="text-center">
						<p className="text-sm text-blue-600 font-medium mb-1">የተመረጠው ቀን</p>
						<p className="text-lg font-bold text-blue-900">
							{formatEthiopianDate(selected, "long")}
						</p>
					</div>
				</div>
			)}

			{/* Regular Calendar with Ethiopian month names overlay */}
			<div className="relative">
				<Calendar
					mode="single"
					selected={selected}
					onSelect={onSelect}
					disabled={disabled}
					showOutsideDays={false}
					captionLayout="label"
					className={cn(
						"rounded-md border border-gray-300 bg-white",
						"text-gray-900"
					)}
					classNames={{
						weekday:
							"text-gray-700 rounded-md flex-1 font-medium text-[0.8rem] select-none",
						day: "relative w-full h-full p-0 text-center aspect-square select-none",
						day_button: "h-9 w-9 p-0 font-normal text-sm text-gray-900",
						selected: "bg-blue-600 text-white",
						today: "ring-2 ring-blue-400",
					}}
					formatters={{
						formatWeekdayName: (date) => {
							// Show Amharic day names
							return getAmharicDayName(date.getDay()).substring(0, 2);
						},
						formatMonthCaption: (date) => {
							// Ethiopian month and year
							const eth = toEthiopianDate(date);
							const ethMonth = getAmharicMonthName(eth.month);
							return `${ethMonth} ${eth.year}`;
						},
						formatDay: (date) => {
							// Ethiopian day number
							const eth = toEthiopianDate(date);
							return String(eth.day);
						},
					}}
				/>
			</div>

			{/* Legend */}
			{/* <div className="text-xs text-gray-600 text-center">
        <p>📅 Calendar shows Gregorian dates with Ethiopian month names</p>
      </div> */}
		</div>
	);
}
