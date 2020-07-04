import React, { useState, useEffect } from "react";
import styled from "styled-components";
import axios from "axios";
import moment from "moment";
import { saturate } from "polished";
import { theme } from "./components/global/theme";
import logo from "./logo.svg";

const { black, yellow, grey, white } = theme;

const StyledApp = styled.div`
	align-items: center;
	background: ${black};
	color: ${yellow};
	display: flex;
	justify-content: center;
	min-height: 100vh;
	min-width: 100vw;
	text-align: center;
	.title {
		font-size: 5rem;
		margin-bottom: 0.25rem;
	}
	.date {
		font-size: 2rem;
		margin-bottom: 0.25rem;
		margin-top: 0.25rem;
	}
	.holidayName {
		font-size: 3.5rem;
		margin-top: 0.25rem;
	}
	.infoText {
		font-size: 2rem;
	}
`;

const StyledSelect = styled.div`
	position: relative;
	height: 47.5px;
	background: ${white};
	border-radius: 0.25rem;

	&:after {
		content: "";
		position: absolute;
		top: 0;
		width: 0;
		height: 0;
		right: 10px;
		bottom: 0;
		margin: auto;
		border-style: solid;
		border-width: 5px 5px 0 5px;
		border-color: ${white} transparent transparent transparent;
		pointer-events: none;
	}

	&:before {
		width: 30px;
		position: absolute;
		top: 0;
		right: 0;
		bottom: 0;
		border-top-right-radius: 0.25rem;
		border-bottom-right-radius: 0.25rem;
		background: ${yellow};
		content: "";
		pointer-events: none;
	}

	&:hover {
		&:before {
			background: ${saturate(0.25, yellow)};
		}
	}

	select {
		font-size: 14px;
		border: none;
		box-shadow: none;
		border-radius: 0;
		background: transparent;
		height: 100%;
		width: 100%;
		cursor: pointer;
		outline: none;
		padding-right: 35px;
		padding-left: 15px;
		border: none;
		border-radius: 0.25rem;

		// Disable default styling on ff
		-moz-appearance: none;

		// Disable ugly ass outline on firefox
		&:-moz-focusring {
			color: transparent;
			text-shadow: 0 0 0 #000;
		}

		// Disable default styling on webkit browsers
		-webkit-appearance: none;

		// Disable default arrow on IE 11+
		&::-ms-expand {
			display: none;
		}

		&:focus {
			border-color: ${yellow};
		}
	}
`;

function App() {
	const [dates, setDates] = useState([]);
	const [location, setLocation] = useState(null);

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
			})
			.catch((error) => {
				console.error(error);
			});
	}, []);

	function Display() {
		if (dates.length !== 0 && location) {
			// Get todays date
			const today = moment();

			// For each item in the dates find the closest to todays date
			const upcomingHolidays = dates.filter(
				(date) => moment(date.Date).isSameOrAfter(today) && date.Jurisdiction === location
			);
			const nextHoliday = upcomingHolidays.reduce((a, b) => (moment(a.Date) < moment(b.Date) ? a : b));

			console.log(nextHoliday);

			return (
				<>
					<h1 className="title">Your next holiday:</h1>
					<h3 className="date">{moment(nextHoliday.Date).format("Do MMM YYYY")}</h3>
					<h4 className="holidayName">{nextHoliday["Holiday Name"]}</h4>
				</>
			);
		}
		if (dates.length === 0 && location) {
			return <div>Your next public holiday is loading...</div>;
		}
		return (
			<>
				<h4 className="infoText">Please select your state</h4>
				<StyledSelect>
					<select selected="default" onChange={(e) => setLocation(e.currentTarget.value)}>
						<option value="default">Select a state</option>
						<option value="act">Australian Capital Territory</option>
						<option value="nsw">New South Wales</option>
						<option value="nt">Northern Territory</option>
						<option value="qld">Queensland</option>
						<option value="sa">South Australia</option>
						<option value="tas">Tasmania</option>
						<option value="vic">Victoria</option>
						<option value="wa">Western Australia</option>
					</select>
				</StyledSelect>
			</>
		);
	}

	return (
		<StyledApp>
			<div>
				<Display />
			</div>
		</StyledApp>
	);
}

export default App;
