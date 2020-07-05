import React, { useEffect, useState } from "react";
import moment from "moment";
import axios from "axios";

export default function HolidayDisplay(props) {
	const [dates, setDates] = useState([]);
	const [datesReturned, setDatesReturned] = useState(false);
	const { location } = props;

	useEffect(() => {
		const year = moment().format("YYYY");
		let endpoint = null;
		if (year === "2020") {
			endpoint =
				"https://data.gov.au/data/api/3/action/datastore_search?resource_id=c4163dc4-4f5a-4cae-b787-43ef0fcf8d8b";
		} else if (year === "2021") {
			endpoint =
				"https://data.gov.au/data/api/3/action/datastore_search?resource_id=2dee10ef-2d0c-44a0-a66b-eb8ce59d9110";
		} else if (year === "2022") {
			endpoint =
				"https://data.gov.au/data/api/3/action/datastore_search?resource_id=d256f989-8f49-46eb-9770-1c6ee9bd2661";
		}
		axios
			.get(endpoint)
			.then((response) => {
				setDates(response.data.result.records);
				setDatesReturned(true);
			})
			.catch((error) => {
				console.error(error);
			});
	}, [location]);

	if (datesReturned) {
		// Get todays date
		const today = moment();

		// For each item in the dates find the closest to todays date
		const upcomingHolidays = dates.filter(
			(date) => moment(date.Date).isSameOrAfter(today) && date.Jurisdiction === location
		);

		const nextHoliday = upcomingHolidays.reduce((a, b) => (moment(a.Date) < moment(b.Date) ? a : b));

		return (
			<>
				<h1 className="title">Your next holiday:</h1>
				<h3 className="date">{moment(nextHoliday.Date).format("Do MMM YYYY")}</h3>
				<h4 className="holidayName">{nextHoliday["Holiday Name"]}</h4>
			</>
		);
	}
	return <div>Your next public holiday is loading...</div>;
}
