import React from "react";
import styled from "styled-components";
import { saturate } from "polished";
import { theme } from "../global/theme";

const { yellow, white } = theme;

const StyledSelect = styled.div`
	position: relative;
	height: 47.5px;
	background: ${white};
	border-radius: 0.25rem;
	max-width: 24rem;
	margin: 2rem auto;

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

export default function Select(props) {
	const { setLocation } = props;
	return (
		<>
			<h1 className="title">Find your next public holiday</h1>
			<span className="infoText">Please select your state</span>
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
			<div className="textContent">
				<p>
					Ever feel like you need a break but not sure if you should take a day off or just wait it out till
					your next public holiday?
				</p>
				<p>
					To then find yourself trawling through each month of some random calendar to try and figure out when
					your next public holiday is?
				</p>
				<p>
					This site is for you, simply select your state, and we will make a call to the open government api
					for public holidays and let you know when your next day off will be.
				</p>
			</div>
		</>
	);
}
