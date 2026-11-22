<template>
	<svg
		viewBox="0 0 640 640"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
		xmlns:xlink="http://www.w3.org/1999/xlink"
	>
		<path
			d="M147.862 215.197L319.871 116L492.01 215.42L492.138 414.038L320.129 513.235L147.99 413.816L147.862 215.197Z"
			fill="#DB0016"
		/>
		<path
			d="M492.01 215.42L492.138 414.038L320.129 513.235L147.99 413.816L147.862 215.197L319.871 116L492.01 215.42ZM187.6 238.135L187.699 390.876L320.143 467.371L452.399 391.099L452.301 238.358L319.856 161.864L187.6 238.135Z"
			fill="black"
			fill-opacity="0.1"
		/>
		<path
			d="M121.517 429.108L320.12 543.811L320.124 528.524L134.753 421.462L121.517 429.108Z"
			fill="#DB0016"
		/>
		<path
			d="M518.607 429.297L320.004 544L320 528.712L505.371 421.651L518.607 429.297Z"
			fill="#DB0016"
		/>
		<path
			d="M518.607 429.297L320.004 544L320 528.712L505.371 421.651L518.607 429.297Z"
			fill="#DB0016"
		/>
		<use xlink:href="#stroke0_4_45" fill="#DB0016" />
		<use xlink:href="#stroke0_4_45" fill="black" fill-opacity="0.1" />
		<use xlink:href="#stroke1_4_45" fill="#DB0016" />
		<use xlink:href="#stroke1_4_45" fill="black" fill-opacity="0.2" />
		<use xlink:href="#stroke2_4_45" fill="#DB0016" />
		<use xlink:href="#stroke2_4_45" fill="black" fill-opacity="0.1" />
		<use xlink:href="#stroke3_4_45" fill="#DB0016" />
		<use xlink:href="#stroke3_4_45" fill="black" fill-opacity="0.2" />
		<defs>
			<path
				id="stroke0_4_45"
				d="M0 237.377H147.862V330.066H39.7241L0 237.377Z"
			/>
			<path
				id="stroke1_4_45"
				d="M70.6207 330.066H147.862V391.858H92.6897L70.6207 330.066Z"
			/>
			<path
				id="stroke2_4_45"
				d="M640 237.377H492.138V330.066H600.276L640 237.377Z"
			/>
			<path
				id="stroke3_4_45"
				d="M569.379 330.066H492.138V391.858H547.31L569.379 330.066Z"
			/>
		</defs>
		<foreignObject x="205" y="240" width="230" height="150">
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
