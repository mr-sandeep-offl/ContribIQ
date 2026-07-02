const fetchMockCommits = () => {
  return [
    {
      message: 'feat: setup authentication middleware and route filters',
      score: 8,
    },
    {
      message: 'fix: resolve MongoDB connection retry bounds',
      score: 5,
    },
    {
      message: 'docs: update API walkthrough routes description',
      score: 3,
    },
    {
      message: 'refactor: modularize telemetry service analytics logic',
      score: 7,
    },
    {
      message: 'test: write integration specs for project routes',
      score: 6,
    },
  ];
};

module.exports = {
  fetchMockCommits,
};
