<template>
	<svg
		viewBox="0 0 640 640"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
		xmlns:xlink="http://www.w3.org/1999/xlink"
	>
		<use xlink:href="#stroke0_1_2" fill="#1AABFF" />
		<use xlink:href="#stroke0_1_2" fill="black" fill-opacity="0.1" />
		<use xlink:href="#stroke1_1_2" fill="#1AABFF" />
		<use xlink:href="#stroke1_1_2" fill="black" fill-opacity="0.2" />
		<use xlink:href="#stroke2_1_2" fill="#1AABFF" />
		<use xlink:href="#stroke2_1_2" fill="black" fill-opacity="0.3" />
		<use xlink:href="#stroke3_1_2" fill="#1AABFF" />
		<use
			xlink:href="#stroke3_1_2"
			fill="url(#paint0_linear_1_2)"
			fill-opacity="0.3"
		/>
		<path
			d="M127 321.182C127 214.49 213.409 128 320 128C426.591 128 513 214.49 513 321.182C513 427.873 426.591 514.363 320 514.363C213.409 514.363 127 427.873 127 321.182ZM320 174.283C238.946 174.283 173.24 240.052 173.24 321.182C173.24 402.311 238.946 468.08 320 468.08C401.054 468.08 466.76 402.311 466.76 321.182C466.76 240.052 401.054 174.283 320 174.283Z"
			fill-rule="evenodd"
			clip-rule="evenodd"
			fill="black"
			fill-opacity="0.1"
		/>
		<defs>
			<linearGradient
				id="paint0_linear_1_2"
				x1="-65.7325"
				y1="320.914"
				x2="698.171"
				y2="321.917"
				gradientUnits="userSpaceOnUse"
			>
				<stop stop-opacity="0" />
				<stop offset="1" />
			</linearGradient>
			<path
				id="stroke0_1_2"
				d="M211.582 319.36H340.691L319.172 525.032L162.987 614.675C152.9 620.465 140.789 611.362 143.531 600.051L211.582 319.36Z"
			/>
			<path
				id="stroke1_1_2"
				d="M426.24 319.36H297.654L319.085 525.032L474.527 614.611C484.608 620.421 496.738 611.328 494.005 600.011L426.24 319.36Z"
			/>
			<path
				id="stroke2_1_2"
				d="M218.203 299.479H421.797V439.092L331.039 632.383C326.25 642.584 311.733 642.526 307.026 632.287L218.203 439.092V299.479Z"
			/>
			<path
				id="stroke3_1_2"
				d="M319.733 128C426.176 128 512.465 214.371 512.465 320.914C512.465 427.457 426.176 513.828 319.733 513.828C213.289 513.828 127 427.457 127 320.914C127 214.371 213.289 128 319.733 128Z"
			/>
		</defs>
		<foreignObject x="220" y="221" width="200" height="200">
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
