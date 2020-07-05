import React, { useState } from "react";
import styled from "styled-components";
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
		font-size: 2.5rem;
		margin-bottom: 0.25rem;
	}
	.date {
		font-size: 4rem;
		margin-bottom: 0.25rem;
		margin-top: 0.25rem;
	}
	.holidayName {
		font-size: 2.5rem;
		margin-top: 0.25rem;
	}
	.infoText {
		font-size: 2rem;
		font-weight: bold;
	}
	.textContent {
		max-width: 32rem;
		text-align: center;
		margin: 0 auto;
	}
`;

function App() {
	const locationHash = window.location.hash !== "" ? window.location.hash.substring(1) : null;
	const [location, setLocation] = useState(locationHash);

	function Display() {
		if (location) {
			return <HolidayDisplay location={location} setLocation={setLocation} />;
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
