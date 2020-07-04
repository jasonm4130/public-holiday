import React, { useState, useEffect } from "react";
import styled from "styled-components";
import axios from "axios";
import moment from "moment";
import { theme } from "./components/global/theme";
import Select from "./components/select/select";
import HolidayDisplay from "./components/holiday-display/holiday-display";

const { black, yellow } = theme;

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

function App() {
	const [location, setLocation] = useState(null);

	function Display() {
		if (location) {
			return <HolidayDisplay location={location} />;
		}
		return <Select setLocation={setLocation} />;
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
