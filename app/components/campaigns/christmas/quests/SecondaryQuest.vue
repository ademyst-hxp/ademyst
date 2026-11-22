<template>
	<svg
		viewBox="0 0 640 640"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
		xmlns:xlink="http://www.w3.org/1999/xlink"
	>
		<use xlink:href="#stroke0_1_7" fill="#56FC7F" />
		<use xlink:href="#stroke0_1_7" fill="black" fill-opacity="0.1" />
		<use xlink:href="#stroke1_1_7" fill="#56FC7F" />
		<use xlink:href="#stroke1_1_7" fill="black" fill-opacity="0.2" />
		<use xlink:href="#stroke2_1_7" fill="#56FC7F" />
		<use
			xlink:href="#stroke2_1_7"
			fill="url(#paint0_linear_1_7)"
			fill-opacity="0.3"
		/>
		<path
			d="M123 324.976C123 216.189 211.2 128 320 128C428.8 128 517 216.189 517 324.976C517 433.763 428.8 521.953 320 521.953C211.2 521.953 123 433.763 123 324.976ZM320 175.192C237.267 175.192 170.198 242.253 170.198 324.976C170.198 407.7 237.267 474.761 320 474.761C402.733 474.761 469.802 407.7 469.802 324.976C469.802 242.253 402.733 175.192 320 175.192Z"
			fill-rule="evenodd"
			clip-rule="evenodd"
			fill="black"
			fill-opacity="0.1"
		/>
		<defs>
			<linearGradient
				id="paint0_linear_1_7"
				x1="123"
				y1="128"
				x2="512.849"
				y2="518.922"
				gradientUnits="userSpaceOnUse"
			>
				<stop stop-opacity="0" />
				<stop offset="1" />
			</linearGradient>
			<path
				id="stroke0_1_7"
				d="M188.461 324.976H342.162L320.205 546.028L188.95 637.609C179.913 643.915 167.595 636.958 168.331 625.964L188.461 324.976Z"
			/>
			<path
				id="stroke1_1_7"
				d="M451.539 324.976H297.837L319.795 546.028L451.05 637.609C460.087 643.915 472.405 636.958 471.669 625.964L451.539 324.976Z"
			/>
			<path
				id="stroke2_1_7"
				d="M517 324.976C517 433.763 428.8 521.953 320 521.953C211.2 521.953 123 433.763 123 324.976C123 216.189 211.2 128 320 128C428.8 128 517 216.189 517 324.976Z"
			/>
		</defs>
		<foreignObject x="220" y="225" width="200" height="200">
			<div xmlns="http://www.w3.org/1999/xhtml" class="quest-content">
				<slot />
			</div>
		</foreignObject>
	</svg>
</template>

<style scoped>
.quest-content {
	width: 100%;
	height: 100%;
	display: flex;
	align-items: center;
	justify-content: center;
	text-align: center;
	box-sizing: border-box;
	overflow: hidden;
	overflow-wrap: anywhere;
	font-size: 28px;
	line-height: 1.2;
	color: var(--quest-text, #fff);
}
</style>
