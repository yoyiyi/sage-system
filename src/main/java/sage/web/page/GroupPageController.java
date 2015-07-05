package sage.web.page;

import java.util.Collection;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.ModelMap;
import org.springframework.web.bind.annotation.*;
import sage.domain.service.*;
import sage.transfer.*;
import sage.util.Colls;
import sage.web.auth.Auth;

@Controller
public class GroupPageController {
  @Autowired
  private GroupService groupService;
  @Autowired
  private UserService userService;
  @Autowired
  private TagService tagService;
  @Autowired
  private BlogPostService blogPostService;
  @Autowired
  private BlogReadService blogReadService;

  @RequestMapping(value = "/group/new", method = RequestMethod.GET)
  String pageCreate() {
    Auth.checkCuid();
    return "new-group";
  }

  @RequestMapping(value = "/group/new", method = RequestMethod.POST)
  @ResponseBody
  String create(@RequestParam String name, @RequestParam String introduction,
                @RequestParam(value = "tagIds[]", defaultValue = "") Collection<Long> tagIds) {
    long id = groupService.create(Auth.checkCuid(), name, introduction, tagIds).id;
    return "/group/" + id;
  }

  @RequestMapping(value = "/group/{id}/edit", method = RequestMethod.GET)
  String pageEdit(@PathVariable Long id, ModelMap model) {
    Auth.checkCuid();
    GroupPreview gp = groupService.getGroupPreview(id);
    model.put("group", gp);
    model.put("existingTags", userService.filterUserTags(Auth.cuid(), gp.tags));
    return "edit-group";
  }

  @RequestMapping(value = "/group/{id}/edit", method = RequestMethod.POST)
  @ResponseBody
  String edit(@PathVariable Long id,
              @RequestParam String name, @RequestParam String introduction,
              @RequestParam(value = "tagIds[]", defaultValue = "") Collection<Long> tagIds) {
    groupService.edit(Auth.checkCuid(), id, name, introduction, tagIds);
    return "/group/" + id;
  }

  @RequestMapping("/group/{id}")
  String group(@PathVariable Long id, ModelMap model) {
    Auth.checkCuid();
    Collection<GroupTopicPreview> topics = Colls.map(groupService.topics(id), GroupTopicPreview::new);
    model.put("group", groupService.getGroupPreview(id));
    model.put("topics", topics);
    return "group";
  }

  @RequestMapping("/groups")
  String groups(ModelMap model) {
    model.put("groups", groupService.all());
    return "groups";
  }

  @RequestMapping("/topic/{id}")
  String topic(@PathVariable Long id, ModelMap model) {
    Auth.checkCuid();
    BlogView bv = new BlogView(groupService.getTopic(id).getBlog());
    UserCard author = userService.getUserCard(Auth.cuid(), bv.getAuthorId());
    model.put("topic", bv);
    model.put("author", author);
    return "topic";
  }

  @RequestMapping(value = "group/{groupId}/submit", method = RequestMethod.POST)
  @ResponseBody
  String topicSubmit(@PathVariable Long groupId, @RequestParam Long blogId) {
    Long cuid = Auth.checkCuid();
    long topicId = groupService.post(cuid, blogId, groupId).getId();
    return "/topic/" + topicId;
  }

  @RequestMapping(value = "group/{groupId}/join", method = RequestMethod.POST)
  @ResponseBody
  void join(@PathVariable Long groupId) {
    groupService.join(Auth.checkCuid(), groupId);
  }

  @RequestMapping(value = "group/{groupId}/leave", method = RequestMethod.POST)
  @ResponseBody
  void leave(@PathVariable Long groupId) {
    groupService.leave(Auth.checkCuid(), groupId);
  }
}
