---
title: "I buried six holes in AI White class."
date: 2026-07-15
tags: [Current log, Jim's AI class, Excel, data cleansing]
provenance: "Take your notes."
maturity: "I'm growing."
content_type: "Cases"
reader_path: cases
lang: en
---

> ♪ Take notes, take notes ♪[[en/conventions|The rules of honesty at this station.]]

I'm making a data set for the next class, Excel. The lesson is how to direct AI to turn a dirty Excel into a direct analysis.

The question is, where do we get a data on the "right in the dirt"?

## Real data, fake wounds.

I've got a real figure: the daily water level of the Sunyang Lake Hydrological Station, 1953 to 2025, exactly 73 years, 26663 rows, all day long.

It's too clean to teach cleaning. However, its character is irreplaceable: on July 12, 2020, the water level was 22,59 metres, 57 days of surveillance throughout the year; on December 22, 2022, it fell to 6.07 metres, and the bottom of the lake was turned into a steppe. Every picture drawn by the students was a real story.

So what I did was cut out 2018 to 2025, eight years, and then dirty it myself. Fake wounds for real data, corresponding to one of the tasks in the course.

## Design logic for six pits.

Every pit is a data disease from the real world:

1. **Merge Cell Titles**: The watch header is not in the first line and the instruction is “Not starting in the first line”;
2. **Text Date Format I**: 2021 written throughout the year`2021/1/1`；
3. **Text Date Format 2**: 2022 written throughout the year`2022年1月1日`I don't know. Two rows, teaching "The dates in your eyes, Excel may be just characters"
4. **Unit accidents**: From 1 to 10 August 2020, 10 lines of data took rice to centimetres and the water level to over 2,000. This is the true type of accident that occurs every day in all walks of life;
5. **Missing and missing**: 12 blanks plus 3 text "unsuggested", teaching plugs and "numbers to be filled shall leave marks";
6. **Repeat Rows**The data were posted twice over a period of five days, before being re-examined.

The fourth of these pits is full of hooks. Class one doesn't have anything, so let them ask AI: What's the highest water level in eight years? I'm going to answer this in a proper manner:**2115 meters**。

The lake is 2,100 metres high, almost a quarter of Everest. The students were staring at the numbers, and the whole lesson was half the lesson: AI was never wrong, but it was the data you gave it. Data is sick, the answer is sick.

There is, of course, another direction: AI may first discover anomalies and warn the participants that data is problematic. Both cases are written in the script, and it's a lesson to catch AI flipping. It's a lesson to see AI's active examination.

## Answer book philosophy

At the same time, I wrote an answer sheet for each of the pits: the objective criteria for the clean-up were rows 2922, consecutive dates, full-line values, maximum 22.59, minimum 6.07. These figures are consistent with my original analysis.

The reason for doing so is that the acceptance of a white lesson cannot be based on a teacher ' s judgement, but must be objective enough for the student to check himself. It's true. It's true.

---

*The class is still in production. Relevant:[[en/garden/协议解析代码必须默认高风险|The protocol resolution code must be defaulted for high risk.]]Again, the idea of “placing the right degree of rigour in the right place”.*
