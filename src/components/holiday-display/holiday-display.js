import React, { useEffect, useState } from "react";
import moment from "moment";
import axios from "axios";
import styled from "styled-components";
import { rgba, darken } from "polished";
import { theme } from "../global/theme";

const { grey, white, yellow } = theme;

const BackButton = styled.button`
	border: none;
	border-radius: 0.25rem;
	color: ${yellow};
	margin: 0;
	padding: 0.5rem 1rem;
	font-weight: bold;
	font-size: 1rem;
	width: auto;
	overflow: visible;
	background: ${grey};
	line-height: normal;
	-webkit-font-smoothing: inherit;
	-moz-osx-font-smoothing: inherit;
	-webkit-appearance: none;
	cursor: pointer;
	transition: background-color 0.3s ease-in-out, box-shadow 0.5s ease-in-out;

	svg {
		display: inline-block;
		width: 1em;
		height: auto;
		margin-left: 1rem;
		fill: ${yellow};
	}

	&:hover {
		box-shadow: 0 0.3rem 0.5rem ${rgba(white, 0.25)};
		background: ${darken(0.1, grey)};
	}
`;

export default function HolidayDisplay(props) {
	const [dates, setDates] = useState([]);
	const [datesReturned, setDatesReturned] = useState(false);
	const { location, setLocation } = props;

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
				<h3 className="date">{moment(nextHoliday.Date).format("ddd Do MMM YYYY")}</h3>
				<h4 className="holidayName">{nextHoliday["Holiday Name"]}</h4>
				<BackButton
					type="button"
					onClick={() => {
						window.history.replaceState(null, null, " ");
						setLocation(null);
					}}
				>
					back to select
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 477.9 477.9">
						<defs />
						<path d="M188 103V17a17 17 0 00-30-11L4 176c-5 7-5 16 0 22l153 188a17 17 0 0031-11v-85c135 5 219 62 257 176a17 17 0 0033-5c0-201-121-349-290-358z" />
					</svg>
				</BackButton>
			</>
		);
	}
	return <div>Your next public holiday is loading...</div>;
}
